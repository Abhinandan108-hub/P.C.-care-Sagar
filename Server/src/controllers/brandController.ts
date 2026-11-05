import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import Brand from "../models/Brand";
import Category from "../models/Category";
import Product from "../models/Product";
import { AuthRequest } from "../middlewares/auth";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function brandPayload(body: Record<string, unknown>) {
  const allowedFields = [
    "name",
    "logo_url",
    "image_url",
    "category_id",
    "description",
    "status",
    "featured",
  ];
  return Object.fromEntries(
    allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );
}

async function findDuplicateBrand(name: string, excludeId?: mongoose.Types.ObjectId) {
  return Brand.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
}

export const getBrands = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const isAdmin = (req as AuthRequest).user?.role === "admin";
  if (req.query.status === "active" || req.query.status === "inactive") {
    filter.status = isAdmin ? req.query.status : "active";
  } else if (req.query.status !== undefined) {
    return res.status(400).json({ success: false, message: "Invalid brand status" });
  } else if (!isAdmin) {
    filter.status = "active";
  }
  const brands = await Brand.find(filter).sort({ name: 1 });
  return res.status(200).json({ success: true, data: brands });
});

export const getBrandById = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid brand ID" });
  }
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
  if (brand.status === "inactive" && (req as AuthRequest).user?.role !== "admin") {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }
  return res.status(200).json({ success: true, data: brand });
});

export const getBrandProducts = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid brand ID" });
  }
  const brand = await Brand.findById(req.params.id);
  if (!brand || (brand.status === "inactive" && (req as AuthRequest).user?.role !== "admin")) {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }

  const page = parsePage(req.query.page, 1);
  const pageSize = parsePage(req.query.pageSize, 20);
  if (page === null || pageSize === null || pageSize > 100) {
    return res.status(400).json({
      success: false,
      message: "page must be positive and pageSize must be between 1 and 100",
    });
  }
  if (
    req.query.status !== undefined &&
    req.query.status !== "active" &&
    req.query.status !== "inactive"
  ) {
    return res.status(400).json({ success: false, message: "Invalid product status" });
  }
  const isAdmin = (req as AuthRequest).user?.role === "admin";
  const filter: Record<string, unknown> = {
    brand: new RegExp(`^${escapeRegex(brand.name)}$`, "i"),
  };
  if (isAdmin && req.query.status) filter.status = req.query.status;
  else if (!isAdmin) filter.status = "active";
  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: {
      products,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  });
});

export const createBrand = asyncHandler(async (req, res) => {
  const payload = brandPayload(req.body);
  const name = String(payload.name).trim();
  if (await findDuplicateBrand(name)) {
    return res.status(409).json({ success: false, message: "A brand with this name already exists" });
  }
  if (payload.category_id) {
    if (
      typeof payload.category_id !== "string" ||
      !validId(payload.category_id) ||
      !(await Category.exists({ _id: payload.category_id }))
    ) {
      return res.status(400).json({ success: false, message: "Invalid category_id" });
    }
  }

  try {
    const brand = await Brand.create({ ...payload, name });
    return res.status(201).json({ success: true, data: brand });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ success: false, message: "A brand with this name already exists" });
    }
    throw error;
  }
});

export const updateBrand = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid brand ID" });
  }
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

  const payload = brandPayload(req.body);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ success: false, message: "No editable brand fields provided" });
  }
  const name = typeof payload.name === "string" ? payload.name.trim() : brand.name;
  if (await findDuplicateBrand(name, brand._id)) {
    return res.status(409).json({ success: false, message: "A brand with this name already exists" });
  }
  if (payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== "") {
    if (
      typeof payload.category_id !== "string" ||
      !validId(payload.category_id) ||
      !(await Category.exists({ _id: payload.category_id }))
    ) {
      return res.status(400).json({ success: false, message: "Invalid category_id" });
    }
  } else if (payload.category_id === "") {
    payload.category_id = null;
  }

  const previousName = brand.name;
  Object.assign(brand, payload, { name });
  try {
    await brand.save();
    if (previousName.toLowerCase() !== name.toLowerCase()) {
      await Product.updateMany(
        { brand: new RegExp(`^${escapeRegex(previousName)}$`, "i") },
        { $set: { brand: name } }
      );
    }
    return res.status(200).json({ success: true, data: brand });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ success: false, message: "A brand with this name already exists" });
    }
    throw error;
  }
});

export const deleteBrand = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid brand ID" });
  }
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });

  const productCount = await Product.countDocuments({ brand: new RegExp(`^${escapeRegex(brand.name)}$`, "i") });
  if (productCount > 0) {
    return res.status(409).json({
      success: false,
      message: "Brand is in use and cannot be deleted",
      data: { productCount },
    });
  }

  await brand.deleteOne();
  return res.status(200).json({ success: true, message: "Brand deleted" });
});

function parsePage(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
