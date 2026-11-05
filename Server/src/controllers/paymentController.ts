import { createHmac, timingSafeEqual } from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import PaymentTransaction from "../models/PaymentTransaction";
import Coupon from "../models/Coupon";
import User from "../models/User";
import { AuthRequest } from "../middlewares/auth";
import { releaseExpiredOrders, restoreOrderStock } from "./orderController";
import { notifyCustomer } from "../utils/notifications";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function getUserId(req: Request) {
  return (req as AuthRequest).user!._id.toString();
}

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function notifyPaymentCustomer(
  order: InstanceType<typeof Order>,
  subject: string,
  message: string
) {
  try {
    const customer = await User.findById(order.user).select("email phone");
    if (!customer) {
      console.error(`Could not notify customer for order ${order.orderNumber}: customer not found`);
      return;
    }
    await notifyCustomer({
      email: customer.email,
      phone: order.shippingAddress.phone || customer.phone,
      subject,
      message: `${message}\nOrder number: ${order.orderNumber}`,
    });
  } catch (error) {
    console.error(`Could not send payment notification for order ${order.orderNumber}:`, error);
  }
}

function getRazorpaySettings() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return { keyId, keySecret };
}

async function razorpayRequest(path: string, method: "GET" | "POST", data?: object) {
  const { keyId, keySecret } = getRazorpaySettings();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const error = result.error as { description?: string } | undefined;
    throw new Error(error?.description || "Razorpay request failed");
  }
  return result;
}

function signatureMatches(value: string, expected: string) {
  const received = Buffer.from(value, "hex");
  const generated = Buffer.from(expected, "hex");
  return received.length === generated.length && timingSafeEqual(received, generated);
}

async function markPaymentFailed(
  transaction: InstanceType<typeof PaymentTransaction>,
  reason: string
) {
  if (transaction.status === "failed") return;
  const order = await Order.findById(transaction.order);
  if (!order || order.paymentStatus === "paid") return;
  transaction.status = "failed";
  transaction.failureReason = reason;
  await transaction.save();
  order.paymentStatus = "failed";
  order.status = "cancelled";
  await order.save();
  await restoreOrderStock(order);
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
  await notifyPaymentCustomer(order, "Payment failed", `Payment failed: ${reason}`);
}

async function refundLatePayment(
  transaction: InstanceType<typeof PaymentTransaction>,
  order: InstanceType<typeof Order>,
  paymentId: string
) {
  if (transaction.refunds.some((refund) => refund.status !== "failed")) return;
  transaction.gatewayPaymentId = paymentId;
  transaction.status = "captured";
  await transaction.save();

  const refund = await razorpayRequest(
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    "POST",
    { notes: { orderId: order._id.toString(), reason: "Order reservation expired" } }
  );
  const refundAmount = Number(refund.amount) / 100 || transaction.amount;
  const refundStatus = refund.status === "processed" ? "processed" : "pending";
  transaction.refunds.push({
    gatewayRefundId: String(refund.id),
    amount: refundAmount,
    status: refundStatus,
  });
  if (refundStatus === "processed") {
    transaction.refundedAmount += refundAmount;
    transaction.status =
      transaction.refundedAmount >= transaction.amount ? "refunded" : "partially_refunded";
  }
  await transaction.save();
  order.paymentStatus = transaction.status === "refunded"
    ? "refunded"
    : transaction.status === "partially_refunded"
      ? "partially_refunded"
      : "paid";
  await order.save();
  await notifyPaymentCustomer(order, "Refund initiated", `A refund was initiated for order ${order.orderNumber}.`);
}

export const createPaymentOrder = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  const { orderId } = req.body as { orderId?: string };
  if (!orderId || !isValidId(orderId)) {
    return res.status(400).json({ success: false, message: "A valid orderId is required" });
  }
  const order = await Order.findOne({ _id: orderId, user: getUserId(req) });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  if (order.paymentMethod !== "razorpay" || order.status !== "pending_payment") {
    return res.status(409).json({ success: false, message: "This order is not awaiting Razorpay payment" });
  }
  if (order.reservationExpiresAt && order.reservationExpiresAt <= new Date()) {
    await releaseExpiredOrders();
    return res.status(409).json({ success: false, message: "Payment reservation expired" });
  }

  const transaction = await PaymentTransaction.findOne({ order: order._id });
  if (!transaction) {
    return res.status(404).json({ success: false, message: "Payment record not found" });
  }
  if (transaction.gatewayOrderId) {
    const { keyId } = getRazorpaySettings();
    return res.status(200).json({
      success: true,
      data: { keyId, gatewayOrderId: transaction.gatewayOrderId, amount: transaction.amount, currency: transaction.currency },
    });
  }

  const razorpayOrder = await razorpayRequest("/orders", "POST", {
    amount: Math.round(order.total * 100),
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString(), orderNumber: order.orderNumber },
  });
  transaction.gatewayOrderId = String(razorpayOrder.id);
  await transaction.save();
  const { keyId } = getRazorpaySettings();
  return res.status(201).json({
    success: true,
    data: {
      keyId,
      gatewayOrderId: transaction.gatewayOrderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  const { gatewayOrderId, gatewayPaymentId, signature } = req.body as {
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    signature?: string;
  };
  if (!gatewayOrderId || !gatewayPaymentId || !signature) {
    return res.status(400).json({ success: false, message: "Payment order, payment ID, and signature are required" });
  }

  const transaction = await PaymentTransaction.findOne({
    gatewayOrderId,
    user: getUserId(req),
    provider: "razorpay",
  });
  if (!transaction) return res.status(404).json({ success: false, message: "Payment record not found" });
  const order = await Order.findById(transaction.order);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  const { keySecret } = getRazorpaySettings();
  const expected = createHmac("sha256", keySecret)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest("hex");
  if (!signatureMatches(signature, expected)) {
    return res.status(400).json({ success: false, message: "Payment signature is invalid" });
  }

  const payment = await razorpayRequest(`/payments/${encodeURIComponent(gatewayPaymentId)}`, "GET");
  if (
    payment.order_id !== gatewayOrderId ||
    Number(payment.amount) !== Math.round(order.total * 100)
  ) {
    return res.status(400).json({ success: false, message: "Payment amount or order does not match" });
  }
  if (payment.status === "failed") {
    await markPaymentFailed(transaction, String(payment.error_description || "Payment failed"));
    return res.status(200).json({ success: true, data: { paymentStatus: "failed" } });
  }
  if (payment.status !== "captured") {
    transaction.status = "authorized";
    transaction.gatewayPaymentId = gatewayPaymentId;
    transaction.gatewaySignature = signature;
    await transaction.save();
    return res.status(202).json({
      success: true,
      message: "Payment is not captured yet. Status will update from Razorpay.",
      data: { paymentStatus: payment.status },
    });
  }

  if (
    order.status === "cancelled" ||
    (order.status === "pending_payment" && !order.stockReserved)
  ) {
    await refundLatePayment(transaction, order, gatewayPaymentId);
    return res.status(409).json({ success: false, message: "Order reservation is no longer active" });
  }
  transaction.status = "captured";
  transaction.gatewayPaymentId = gatewayPaymentId;
  transaction.gatewaySignature = signature;
  await transaction.save();
  order.paymentStatus = "paid";
  order.status = "confirmed";
  order.reservationExpiresAt = null;
  await order.save();
  await notifyPaymentCustomer(order, "Payment confirmed", `Payment received for INR ${order.total.toFixed(2)}.`);
  return res.status(200).json({ success: true, data: { order, paymentStatus: "paid" } });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  const payments = await PaymentTransaction.find({ user: getUserId(req) })
    .select("-gatewaySignature")
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: payments });
});

export const syncPaymentStatus = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  if (!isValidId(req.params.orderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  const order = await Order.findOne({ _id: req.params.orderId, user: getUserId(req) });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  const transaction = await PaymentTransaction.findOne({ order: order._id });
  if (!transaction) return res.status(404).json({ success: false, message: "Payment record not found" });
  if (transaction.provider === "razorpay" && transaction.gatewayPaymentId) {
    const payment = await razorpayRequest(
      `/payments/${encodeURIComponent(transaction.gatewayPaymentId)}`,
      "GET"
    );
    if (
      payment.status === "captured" &&
      (order.status === "cancelled" ||
        (order.status === "pending_payment" && !order.stockReserved))
    ) {
      await refundLatePayment(transaction, order, transaction.gatewayPaymentId!);
    } else if (payment.status === "captured" && order.paymentStatus !== "paid") {
      transaction.status = "captured";
      await transaction.save();
      order.paymentStatus = "paid";
      if (order.status === "pending_payment") order.status = "confirmed";
      order.reservationExpiresAt = null;
      await order.save();
      await notifyPaymentCustomer(order, "Payment confirmed", `Payment received for INR ${order.total.toFixed(2)}.`);
    } else if (payment.status === "failed" && transaction.status !== "failed") {
      await markPaymentFailed(transaction, String(payment.error_description || "Payment failed"));
    }
  }
  return res.status(200).json({
    success: true,
    data: { orderId: order._id, orderStatus: order.status, paymentStatus: order.paymentStatus },
  });
});

export const refundPayment = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.orderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  const transaction = await PaymentTransaction.findOne({
    order: order._id,
    provider: "razorpay",
    status: { $in: ["captured", "partially_refunded"] },
  });
  if (!transaction?.gatewayPaymentId) {
    return res.status(409).json({ success: false, message: "No captured Razorpay payment to refund" });
  }

  const amountRequestedForRefund = transaction.refunds
    .filter((refund) => refund.status !== "failed")
    .reduce((sum, refund) => sum + refund.amount, 0);
  const remainingAmount = transaction.amount - amountRequestedForRefund;
  const refundAmount = req.body.amount === undefined ? remainingAmount : Number(req.body.amount);
  if (
    !Number.isFinite(refundAmount) ||
    refundAmount <= 0 ||
    refundAmount > remainingAmount
  ) {
    return res.status(400).json({ success: false, message: "Refund amount is invalid" });
  }
  const refund = await razorpayRequest(
    `/payments/${encodeURIComponent(transaction.gatewayPaymentId)}/refund`,
    "POST",
    {
      amount: Math.round(refundAmount * 100),
      notes: { orderId: order._id.toString(), reason: String(req.body.reason || "Customer refund") },
    }
  );
  const refundId = String(refund.id);
  const refundStatus = refund.status === "processed" ? "processed" : "pending";
  transaction.refunds.push({
    gatewayRefundId: refundId,
    amount: refundAmount,
    status: refundStatus,
  });
  if (refundStatus === "processed") transaction.refundedAmount += refundAmount;
  transaction.status = refundStatus === "processed"
    ? transaction.refundedAmount >= transaction.amount
      ? "refunded"
      : "partially_refunded"
    : transaction.status;
  await transaction.save();
  if (refundStatus === "processed") {
    order.paymentStatus =
      transaction.status === "refunded" ? "refunded" : "partially_refunded";
    await order.save();
    await notifyPaymentCustomer(order, "Refund processed", `A refund of INR ${refundAmount.toFixed(2)} was processed.`);
  }
  return res.status(200).json({ success: true, data: { refund, transaction, order } });
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!webhookSecret || typeof signature !== "string" || !rawBody) {
    return res.status(400).json({ success: false, message: "Webhook configuration or signature is missing" });
  }
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  if (!signatureMatches(signature, expected)) {
    return res.status(400).json({ success: false, message: "Webhook signature is invalid" });
  }

  const event = req.body as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          error_description?: string;
        };
      };
      refund?: { entity?: { id?: string; payment_id?: string; amount?: number; status?: string } };
    };
  };
  const payment = event.payload?.payment?.entity;
  if (event.event === "refund.processed" || event.event === "refund.failed") {
    const refund = event.payload?.refund?.entity;
    const transaction = refund?.payment_id
      ? await PaymentTransaction.findOne({ gatewayPaymentId: refund.payment_id })
      : null;
    if (!transaction || !refund?.id) {
      return res.status(200).json({ success: true, message: "Refund record not found" });
    }
    const order = await Order.findById(transaction.order);
    const savedRefund = transaction.refunds.find((item) => item.gatewayRefundId === refund.id);
    if (order && savedRefund && savedRefund.status === "pending") {
      if (event.event === "refund.processed") {
        savedRefund.status = "processed";
        transaction.refundedAmount += savedRefund.amount;
      } else {
        savedRefund.status = "failed";
      }
      transaction.status = transaction.refundedAmount >= transaction.amount
        ? "refunded"
        : transaction.refundedAmount > 0
          ? "partially_refunded"
          : "captured";
      await transaction.save();
      order.paymentStatus = transaction.status === "refunded"
        ? "refunded"
        : transaction.status === "partially_refunded"
          ? "partially_refunded"
          : "paid";
      await order.save();
    }
    return res.status(200).json({ success: true });
  }
  if (!payment?.order_id || !payment.id) {
    return res.status(200).json({ success: true, message: "Event does not need processing" });
  }
  const transaction = await PaymentTransaction.findOne({ gatewayOrderId: payment.order_id });
  if (!transaction) return res.status(200).json({ success: true, message: "Payment record not found" });

  const order = await Order.findById(transaction.order);
  if (!order) return res.status(200).json({ success: true, message: "Order not found" });

  if (event.event === "payment.captured") {
    if (
      Number(payment.amount) !== Math.round(transaction.amount * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({ success: false, message: "Webhook payment amount does not match" });
    }
    if (
      order.status === "cancelled" ||
      (order.status === "pending_payment" && !order.stockReserved)
    ) {
      await refundLatePayment(transaction, order, payment.id);
      return res.status(200).json({ success: true });
    }
    if (transaction.status !== "captured") {
      transaction.status = "captured";
      transaction.gatewayPaymentId = payment.id;
      await transaction.save();
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.reservationExpiresAt = null;
      await order.save();
      await notifyPaymentCustomer(order, "Payment confirmed", `Payment received for INR ${order.total.toFixed(2)}.`);
    }
  } else if (event.event === "payment.failed") {
    if (transaction.status !== "captured" && transaction.status !== "refunded") {
      transaction.gatewayPaymentId = payment.id;
      await markPaymentFailed(transaction, payment.error_description || "Payment failed");
    }
  }
  return res.status(200).json({ success: true });
});
