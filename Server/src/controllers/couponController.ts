import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import Coupon from "../models/Coupon";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function getCouponData(body: Record<string, unknown>) {
  const fields = [
    "code",
    "type",
    "amount",
    "minimumSubtotal",
    "maximumDiscount",
    "maxUses",
    "startsAt",
    "expiresAt",
    "isActive",
  ];
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) data[field] = body[field];
  }
  if (typeof data.code === "string") data.code = data.code.trim().toUpperCase();
  return data;
}

export const getCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: coupons });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const data = getCouponData(req.body);
  if (data.type === "percentage" && Number(data.amount) > 100) {
    return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100" });
  }
  try {
    const coupon = await Coupon.create(data);
    return res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }
    throw error;
  }
});

export const updateCoupon = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid coupon ID" });
  }
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
  const data = getCouponData(req.body);
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: "No coupon fields provided" });
  }
  const type = data.type ?? coupon.type;
  const amount = Number(data.amount ?? coupon.amount);
  if (type === "percentage" && amount > 100) {
    return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100" });
  }
  Object.assign(coupon, data);
  try {
    await coupon.save();
    return res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }
    throw error;
  }
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid coupon ID" });
  }
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
  return res.status(200).json({ success: true, message: "Coupon deleted" });
});
