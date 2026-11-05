import { NextFunction, Request, RequestHandler, Response } from "express";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Cart from "../models/Cart";
import Coupon from "../models/Coupon";
import Order from "../models/Order";
import PaymentTransaction from "../models/PaymentTransaction";
import Product from "../models/Product";
import User from "../models/User";
import { AuthRequest } from "../middlewares/auth";
import { notifyCustomer } from "../utils/notifications";

const configuredHoldMinutes = Number(process.env.STOCK_RESERVATION_MINUTES);
const holdMinutes =
  Number.isInteger(configuredHoldMinutes) && configuredHoldMinutes > 0
    ? configuredHoldMinutes
    : 15;

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

async function notifyOrderCustomer(
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
    console.error(`Could not send notification for order ${order.orderNumber}:`, error);
  }
}

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function makeOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `PC-${date}-${random}`;
}

function getShippingCharge() {
  const configuredCharge = process.env.SHIPPING_CHARGE;
  if (!configuredCharge) return 0;
  const charge = Number(configuredCharge);
  if (!Number.isFinite(charge) || charge < 0) {
    throw new Error("SHIPPING_CHARGE must be a non-negative number");
  }
  return charge;
}

async function getCheckoutData(userId: string, couponCode?: string) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty" as const };
  }

  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));
  const unavailableItems: Array<{ productId: string; reason: string }> = [];
  const priceChanges: Array<{
    productId: string;
    oldPrice: number;
    currentPrice: number;
  }> = [];
  const orderItems: Array<{
    product: mongoose.Types.ObjectId;
    name: string;
    image_url: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  let subtotal = 0;
  for (const cartItem of cart.items) {
    const product = productsById.get(cartItem.product.toString());
    if (!product) {
      unavailableItems.push({ productId: cartItem.product.toString(), reason: "deleted" });
      continue;
    }
    if (product.status !== "active") {
      unavailableItems.push({ productId: product.id, reason: "inactive" });
      continue;
    }
    if (product.availability !== "in_stock" || product.stock < cartItem.quantity) {
      unavailableItems.push({ productId: product.id, reason: "insufficient_stock" });
      continue;
    }
    if (product.price !== cartItem.priceAtAdd) {
      priceChanges.push({
        productId: product.id,
        oldPrice: cartItem.priceAtAdd,
        currentPrice: product.price,
      });
    }
    const lineTotal = product.price * cartItem.quantity;
    subtotal += lineTotal;
    orderItems.push({
      product: product._id,
      name: product.name,
      image_url: product.image_url ?? null,
      quantity: cartItem.quantity,
      unitPrice: product.price,
      lineTotal,
    });
  }

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
    if (
      !coupon ||
      (coupon.startsAt && coupon.startsAt > new Date()) ||
      (coupon.expiresAt && coupon.expiresAt < new Date()) ||
      (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) ||
      subtotal < coupon.minimumSubtotal
    ) {
      return { error: "Coupon is invalid, expired, or not applicable" as const };
    }
    if (coupon.type === "percentage") {
      discount = (subtotal * coupon.amount) / 100;
      if (coupon.maximumDiscount !== null && coupon.maximumDiscount !== undefined) {
        discount = Math.min(discount, coupon.maximumDiscount);
      }
    } else {
      discount = coupon.amount;
    }
    discount = Math.min(Math.round(discount * 100) / 100, subtotal);
  }

  const shippingCharge = getShippingCharge();
  return {
    cart,
    coupon,
    orderItems,
    subtotal: Math.round(subtotal * 100) / 100,
    shippingCharge,
    discount,
    total: Math.round((subtotal + shippingCharge - discount) * 100) / 100,
    unavailableItems,
    priceChanges,
  };
}

async function reserveStock(
  items: Array<{ product: mongoose.Types.ObjectId; quantity: number }>
) {
  const reservedItems: typeof items = [];
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      {
        _id: item.product,
        status: "active",
        availability: "in_stock",
        stock: { $gte: item.quantity },
      },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!product) {
      await restoreItems(reservedItems);
      return false;
    }
    reservedItems.push(item);
    if (product.stock === 0) {
      await Product.updateOne({ _id: product._id, stock: 0 }, { $set: { availability: "out_of_stock" } });
    }
  }
  return true;
}

async function restoreItems(items: Array<{ product: mongoose.Types.ObjectId; quantity: number }>) {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity }, $set: { availability: "in_stock" } }
    );
  }
}

export async function restoreOrderStock(order: InstanceType<typeof Order>) {
  if (!order.stockReserved) return;
  order.stockReserved = false;
  order.reservationExpiresAt = null;
  await order.save();
  await restoreItems(order.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
  })));
}

export async function releaseExpiredOrders() {
  const expiredOrders = await Order.find({
    status: "pending_payment",
    stockReserved: true,
    reservationExpiresAt: { $lte: new Date() },
  });
  for (const order of expiredOrders) {
    order.status = "cancelled";
    order.paymentStatus = "failed";
    order.notes = "Online payment reservation expired";
    await restoreOrderStock(order);
    await PaymentTransaction.updateMany(
      { order: order._id, status: { $in: ["created", "authorized"] } },
      { $set: { status: "failed", failureReason: "Payment reservation expired" } }
    );
    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    }
  }
}

function checkAddress(address: Record<string, unknown>) {
  const required = ["fullName", "phone", "addressLine1", "city", "state", "postalCode", "country"];
  for (const field of required) {
    if (typeof address[field] !== "string" || !address[field].trim()) {
      return `${field} is required`;
    }
  }
  if (!/^[0-9+()\-\s]{7,20}$/.test(String(address.phone))) {
    return "phone number is invalid";
  }
  if (String(address.postalCode).trim().length > 20) {
    return "postalCode is too long";
  }
  return null;
}

export const validateCheckout = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  const addressError = checkAddress(req.body.shippingAddress || {});
  if (addressError) {
    return res.status(400).json({ success: false, message: addressError });
  }

  const result = await getCheckoutData(getUserId(req), req.body.couponCode);
  if ("error" in result) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(200).json({
    success: true,
    data: {
      items: result.orderItems,
      subtotal: result.subtotal,
      shippingCharge: result.shippingCharge,
      discount: result.discount,
      total: result.total,
      unavailableItems: result.unavailableItems,
      priceChanges: result.priceChanges,
      requiresPriceConfirmation: result.priceChanges.length > 0,
    },
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  const addressError = checkAddress(req.body.shippingAddress || {});
  if (addressError) {
    return res.status(400).json({ success: false, message: addressError });
  }
  if (req.body.paymentMethod !== "cod" && req.body.paymentMethod !== "razorpay") {
    return res.status(400).json({ success: false, message: "paymentMethod must be cod or razorpay" });
  }

  const result = await getCheckoutData(getUserId(req), req.body.couponCode);
  if ("error" in result) {
    return res.status(400).json({ success: false, message: result.error });
  }
  if (result.unavailableItems.length > 0) {
    return res.status(409).json({
      success: false,
      message: "Some cart products are unavailable",
      data: { unavailableItems: result.unavailableItems },
    });
  }
  if (result.priceChanges.length > 0 && req.body.confirmPriceChanges !== true) {
    return res.status(409).json({
      success: false,
      message: "Product prices changed. Confirm the new prices before placing the order.",
      data: { priceChanges: result.priceChanges },
    });
  }
  if (result.orderItems.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart has no available products" });
  }
  if (req.body.paymentMethod === "razorpay" && result.total <= 0) {
    return res.status(400).json({ success: false, message: "Online payment total must be greater than zero" });
  }

  if (result.coupon) {
    const couponUpdate = await Coupon.updateOne(
      {
        _id: result.coupon._id,
        isActive: true,
        $or: [{ maxUses: null }, { maxUses: { $exists: false } }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }],
      },
      { $inc: { usedCount: 1 } }
    );
    if (couponUpdate.modifiedCount !== 1) {
      return res.status(409).json({ success: false, message: "Coupon has reached its usage limit" });
    }
  }

  const stockReserved = await reserveStock(result.orderItems);
  if (!stockReserved) {
    if (result.coupon) {
      await Coupon.updateOne({ _id: result.coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    }
    return res.status(409).json({ success: false, message: "Stock changed. Please review your cart." });
  }

  const isCod = req.body.paymentMethod === "cod";
  const order = await Order.create({
    orderNumber: makeOrderNumber(),
    user: getUserId(req),
    items: result.orderItems,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: req.body.paymentMethod,
    paymentStatus: "pending",
    status: isCod ? "confirmed" : "pending_payment",
    subtotal: result.subtotal,
    shippingCharge: result.shippingCharge,
    discount: result.discount,
    total: result.total,
    couponCode: result.coupon?.code ?? null,
    stockReserved: true,
    reservationExpiresAt: isCod ? null : new Date(Date.now() + holdMinutes * 60 * 1000),
  }).catch(async (error) => {
    await restoreItems(result.orderItems);
    if (result.coupon) {
      await Coupon.updateOne({ _id: result.coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    }
    throw error;
  });

  try {
    await PaymentTransaction.create({
      order: order._id,
      user: order.user,
      provider: isCod ? "cod" : "razorpay",
      amount: order.total,
      currency: "INR",
      status: "created",
    });
    result.cart.items = [];
    await result.cart.save();
  } catch (error) {
    await PaymentTransaction.deleteMany({ order: order._id });
    await order.deleteOne();
    await restoreItems(result.orderItems);
    if (result.coupon) {
      await Coupon.updateOne({ _id: result.coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    }
    throw error;
  }
  await notifyOrderCustomer(
    order,
    "Order confirmation",
    `Your order has been ${isCod ? "confirmed" : "placed"}. Total: INR ${order.total.toFixed(2)}.`
  );
  return res.status(201).json({
    success: true,
    data: {
      order,
      paymentRequired: !isCod,
      reservationExpiresAt: order.reservationExpiresAt,
    },
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  await releaseExpiredOrders();
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ success: false, message: "Invalid page or pageSize" });
  }
  const filter = { user: getUserId(req) };
  const [orders, totalCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    Order.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: { orders, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
  });
});

export const getOrderDetails = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  await releaseExpiredOrders();
  const user = (req as AuthRequest).user!;
  const filter: Record<string, unknown> = { _id: req.params.id };
  if (user.role !== "admin") filter.user = user._id;
  const order = await Order.findOne(filter);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  const payments = await PaymentTransaction.find({ order: order._id }).select("-gatewaySignature");
  return res.status(200).json({
    success: true,
    data: { order, tracking: { status: order.status, trackingNumber: order.trackingNumber }, payments },
  });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  const order = await Order.findOne({ _id: req.params.id, user: getUserId(req) });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  if (["shipped", "delivered", "cancelled"].includes(order.status)) {
    return res.status(409).json({ success: false, message: "This order can no longer be cancelled" });
  }
  if (order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded") {
    return res.status(409).json({
      success: false,
      message: "Paid orders need to be refunded by support before cancellation",
    });
  }

  order.status = "cancelled";
  order.paymentStatus = order.paymentMethod === "razorpay" ? "failed" : "pending";
  await restoreOrderStock(order);
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
  await PaymentTransaction.updateMany(
    { order: order._id, status: { $in: ["created", "authorized"] } },
    { $set: { status: "failed", failureReason: "Order cancelled" } }
  );
  await notifyOrderCustomer(order, "Order cancelled", "Your order has been cancelled.");
  return res.status(200).json({ success: true, data: order, message: "Order cancelled" });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  const allowedStatuses = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: "Invalid order status" });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  if (order.status === "cancelled" || order.status === "delivered") {
    return res.status(409).json({ success: false, message: "Order is already complete" });
  }
  if (
    ["processing", "shipped", "delivered"].includes(req.body.status) &&
    order.paymentMethod === "razorpay" &&
    order.paymentStatus !== "paid"
  ) {
    return res.status(409).json({ success: false, message: "Online payment must be confirmed before fulfillment" });
  }
  if (
    req.body.status === "confirmed" &&
    order.paymentMethod === "razorpay" &&
    order.paymentStatus !== "paid"
  ) {
    return res.status(409).json({ success: false, message: "Online payment must be confirmed first" });
  }
  const allowedNextStatuses: Record<string, string[]> = {
    pending_payment: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
  };
  if (!allowedNextStatuses[order.status]?.includes(req.body.status)) {
    return res.status(409).json({
      success: false,
      message: `Cannot change order status from ${order.status} to ${req.body.status}`,
    });
  }
  if (req.body.status === "cancelled") {
    if (order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded") {
      return res.status(409).json({ success: false, message: "Refund the payment before cancelling" });
    }
    await restoreOrderStock(order);
    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    }
    await PaymentTransaction.updateMany(
      { order: order._id, status: { $in: ["created", "authorized"] } },
      { $set: { status: "failed", failureReason: "Order cancelled by admin" } }
    );
    order.status = "cancelled";
  } else {
    order.status = req.body.status;
    if (req.body.status === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
      order.stockReserved = false;
      order.reservationExpiresAt = null;
      await PaymentTransaction.updateMany(
        { order: order._id, provider: "cod" },
        { $set: { status: "captured" } }
      );
    }
    if (req.body.status === "shipped" || req.body.status === "delivered") {
      order.stockReserved = false;
      order.reservationExpiresAt = null;
    }
  }
  if (req.body.trackingNumber !== undefined) {
    order.trackingNumber = String(req.body.trackingNumber).trim() || null;
  }
  await order.save();
  await notifyOrderCustomer(
    order,
    "Order status update",
    `Your order status is now ${order.status}.${order.trackingNumber ? ` Tracking number: ${order.trackingNumber}.` : ""}`
  );
  return res.status(200).json({ success: true, data: order });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ success: false, message: "Invalid page or pageSize" });
  }
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === "string") filter.status = req.query.status;
  const [orders, totalCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    Order.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: { orders, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
  });
});

export const getInvoice = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }
  const user = (req as AuthRequest).user!;
  const filter: Record<string, unknown> = { _id: req.params.id };
  if (user.role !== "admin") filter.user = user._id;
  const order = await Order.findOne(filter);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${order.orderNumber}.pdf"`);
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(22).text("P.C. Care Sagar - Invoice");
  pdf.moveDown();
  pdf.fontSize(12).text(`Order: ${order.orderNumber}`);
  pdf.text(`Date: ${order.createdAt.toLocaleDateString("en-IN")}`);
  pdf.text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`);
  pdf.moveDown().text("Ship to:");
  pdf.text(order.shippingAddress.fullName);
  pdf.text(`${order.shippingAddress.addressLine1} ${order.shippingAddress.addressLine2 || ""}`);
  pdf.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`);
  pdf.text(`${order.shippingAddress.country} | ${order.shippingAddress.phone}`);
  pdf.moveDown().text("Items:");
  for (const item of order.items) {
    pdf.text(`${item.name} x ${item.quantity} @ INR ${item.unitPrice.toFixed(2)} = INR ${item.lineTotal.toFixed(2)}`);
  }
  pdf.moveDown();
  pdf.text(`Subtotal: INR ${order.subtotal.toFixed(2)}`);
  pdf.text(`Shipping: INR ${order.shippingCharge.toFixed(2)}`);
  pdf.text(`Discount: - INR ${order.discount.toFixed(2)}`);
  pdf.fontSize(14).text(`Total: INR ${order.total.toFixed(2)}`);
  pdf.end();
});
