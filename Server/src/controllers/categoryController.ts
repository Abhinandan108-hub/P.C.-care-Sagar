import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import Category from "../models/Category";
import Brand from "../models/Brand";
import Product from "../models/Product";
import { AuthRequest } from "../middlewares/auth";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function categoryPayload(body: Record<string, unknown>) {
  const allowedFields = [
    "name",
    "slug",
    "image_url",
    "display_order",
    "status",
    "featured",
    "description",
  ];
  return Object.fromEntries(
    allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findDuplicateCategory(
  name: string,
  slug: string,
  excludeId?: mongoose.Types.ObjectId
) {
  return Category.findOne({
    $and: [
      { ...(excludeId ? { _id: { $ne: excludeId } } : {}) },
      {
        $or: [
          { name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } },
          { slug: { $regex: `^${escapeRegex(slug)}$`, $options: "i" } },
        ],
      },
    ],
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const getCategories = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  const isAdmin = (req as AuthRequest).user?.role === "admin";
  if (req.query.status === "active" || req.query.status === "inactive") {
    filter.status = isAdmin ? req.query.status : "active";
  } else if (req.query.status !== undefined) {
    return res.status(400).json({ success: false, message: "Invalid category status" });
  } else if (!isAdmin) {
    filter.status = "active";
  }

  const categories = await Category.find(filter).sort({ display_order: 1, name: 1 });
  return res.status(200).json({ success: true, data: categories });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  if (category.status === "inactive" && (req as AuthRequest).user?.role !== "admin") {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  return res.status(200).json({ success: true, data: category });
});

export const getCategoryProducts = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
  const category = await Category.findById(req.params.id);
  if (!category || (category.status === "inactive" && (req as AuthRequest).user?.role !== "admin")) {
    return res.status(404).json({ success: false, message: "Category not found" });
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
    category: new RegExp(`^${escapeRegex(category.name)}$`, "i"),
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

export const createCategory = asyncHandler(async (req, res) => {
  const payload = categoryPayload(req.body);
  const name = String(payload.name).trim();
  const slug = typeof payload.slug === "string" ? slugify(payload.slug) : slugify(name);
  if (!slug) {
    return res.status(400).json({ success: false, message: "Category slug is invalid" });
  }
  if (await findDuplicateCategory(name, slug)) {
    return res.status(409).json({
      success: false,
      message: "A category with this name or slug already exists",
    });
  }

  try {
    const category = await Category.create({ ...payload, name, slug });
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name or slug already exists",
      });
    }
    throw error;
  }
});

export const updateCategory = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  const payload = categoryPayload(req.body);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ success: false, message: "No editable category fields provided" });
  }
  const name = typeof payload.name === "string" ? payload.name.trim() : category.name;
  const slugInput =
    typeof payload.slug === "string"
      ? payload.slug
      : payload.name !== undefined
        ? name
        : category.slug;
  const slug = slugify(slugInput);
  if (!slug) {
    return res.status(400).json({ success: false, message: "Category slug is invalid" });
  }
  if (await findDuplicateCategory(name, slug, category._id)) {
    return res.status(409).json({
      success: false,
      message: "A category with this name or slug already exists",
    });
  }

  const previousName = category.name;
  Object.assign(category, payload, { name, slug });
  try {
    await category.save();
    if (previousName.toLowerCase() !== name.toLowerCase()) {
      await Product.updateMany(
        { category: new RegExp(`^${escapeRegex(previousName)}$`, "i") },
        { $set: { category: name } }
      );
    }
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name or slug already exists",
      });
    }
    throw error;
  }
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  const [productCount, brandCount] = await Promise.all([
    Product.countDocuments({
      category: new RegExp(`^${escapeRegex(category.name)}$`, "i"),
    }),
    Brand.countDocuments({ category_id: category._id.toString() }),
  ]);
  if (productCount > 0 || brandCount > 0) {
    return res.status(409).json({
      success: false,
      message: "Category is in use and cannot be deleted",
      data: { productCount, brandCount },
    });
  }

  await category.deleteOne();
  return res.status(200).json({ success: true, message: "Category deleted" });
});

function parsePage(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
