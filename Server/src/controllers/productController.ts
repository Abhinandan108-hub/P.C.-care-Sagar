import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import { AuthRequest } from "../middlewares/auth";

const editableFields = [
  "name",
  "slug",
  "description",
  "price",
  "mrp",
  "offer_percentage",
  "stock",
  "category",
  "brand",
  "image_url",
  "gallery_images",
  "processor",
  "ram",
  "storage",
  "graphics",
  "display_size",
  "operating_system",
  "warranty",
  "status",
  "featured",
  "latest",
  "availability",
  "specifications",
  "highlights",
] as const;

const sortFields: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_low_high: { price: 1 },
  price_desc: { price: -1 },
  price_high_low: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
};

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function parseBoolean(value: unknown): boolean | undefined | null {
  if (value === undefined) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(value: string, excludeId?: mongoose.Types.ObjectId) {
  const baseSlug = makeSlug(value) || "product";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await Product.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function productPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  }
  return payload;
}

function userCanManageProduct(user: AuthRequest["user"], product: { seller: unknown }) {
  return Boolean(
    user &&
      (user.role === "admin" ||
      (user.role === "seller" && String(product.seller) === user._id.toString()))
  );
}

function canViewInactiveProduct(user: AuthRequest["user"], product: { seller: unknown }) {
  return Boolean(user && (user.role === "admin" || userCanManageProduct(user, product)));
}

function parsePageValue(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function listProducts(
  req: Request,
  res: Response,
  extraFilters: Record<string, unknown> = {}
) {
  const user = (req as AuthRequest).user;
  const page = parsePageValue(req.query.page, 1);
  const pageSize = parsePageValue(req.query.pageSize, 20);
  if (page === null || pageSize === null || pageSize > 100) {
    return res.status(400).json({
      success: false,
      message: "page must be positive and pageSize must be between 1 and 100",
    });
  }

  const filters: Record<string, unknown> = { ...extraFilters };
  if (user?.role === "seller") {
    filters.seller = user._id;
  }

  const status = queryString(req.query.status);
  if (status !== undefined) {
    if (status !== "active" && status !== "inactive") {
      return res.status(400).json({ success: false, message: "Invalid product status" });
    }
    if (user?.role === "admin" || user?.role === "seller") {
      filters.status = status;
    } else {
      filters.status = "active";
    }
  } else if (user?.role !== "admin" && user?.role !== "seller") {
    filters.status = "active";
  }

  for (const field of ["category", "brand"] as const) {
    const value = queryString(req.query[field]);
    if (value) filters[field] = new RegExp(`^${escapeRegex(value)}$`, "i");
  }

  const availability = queryString(req.query.availability);
  if (availability) {
    if (!["in_stock", "out_of_stock", "coming_soon"].includes(availability)) {
      return res.status(400).json({ success: false, message: "Invalid product availability" });
    }
    filters.availability = availability;
  }

  for (const field of ["featured", "latest"] as const) {
    const value = parseBoolean(req.query[field]);
    if (value === null) {
      return res.status(400).json({ success: false, message: `${field} must be true or false` });
    }
    if (value !== undefined) filters[field] = value;
  }

  const minPriceText = queryString(req.query.minPrice);
  const maxPriceText = queryString(req.query.maxPrice);
  const minPrice = minPriceText === undefined ? undefined : Number(minPriceText);
  const maxPrice = maxPriceText === undefined ? undefined : Number(maxPriceText);
  if (
    (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
    (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
    (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
  ) {
    return res.status(400).json({ success: false, message: "Invalid price range" });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filters.price = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }

  const search = queryString(req.query.search) || queryString(req.query.q);
  if (search) {
    if (search.length > 100) {
      return res.status(400).json({ success: false, message: "search cannot exceed 100 characters" });
    }
    const searchRegex = new RegExp(escapeRegex(search), "i");
    filters.$or = [
      { name: searchRegex },
      { slug: searchRegex },
      { brand: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
    ];
  }

  const sortBy = queryString(req.query.sort) || queryString(req.query.sortBy) || "newest";
  const sort = sortFields[sortBy];
  if (!sort) {
    return res.status(400).json({
      success: false,
      message: "sort must be newest, oldest, price_asc, price_desc, name_asc, or name_desc",
    });
  }

  Object.assign(filters, extraFilters);
  const skip = (page - 1) * pageSize;
  const [products, totalCount] = await Promise.all([
    Product.find(filters).sort(sort).skip(skip).limit(pageSize),
    Product.countDocuments(filters),
  ]);
  return res.status(200).json({
    success: true,
    data: {
      products,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: skip + products.length < totalCount,
      hasPreviousPage: page > 1,
    },
  });
}

async function findVisibleProduct(req: Request, res: Response, bySlug = false) {
  const user = (req as AuthRequest).user;
  if (!bySlug && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ success: false, message: "Invalid product ID" });
    return null;
  }

  const product = bySlug
    ? await Product.findOne({ slug: req.params.slug })
    : await Product.findById(req.params.id);
  if (!product || (product.status !== "active" && !canViewInactiveProduct(user, product))) {
    res.status(404).json({ success: false, message: "Product not found" });
    return null;
  }
  return product;
}

export const getProducts = asyncHandler((req, res) => listProducts(req, res));

export const getFeaturedProducts = asyncHandler((req, res) =>
  listProducts(req, res, { featured: true })
);

export const getLatestProducts = asyncHandler((req, res) =>
  listProducts(req, res, { latest: true })
);

export const getProductsByAvailability = asyncHandler((req, res) => {
  const availability = req.params.availability;
  if (!["in_stock", "out_of_stock", "coming_soon"].includes(availability)) {
    return Promise.resolve(
      res.status(400).json({ success: false, message: "Invalid product availability" })
    );
  }
  return listProducts(req, res, { availability });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await findVisibleProduct(req, res);
  if (product) return res.status(200).json({ success: true, data: product });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await findVisibleProduct(req, res, true);
  if (product) return res.status(200).json({ success: true, data: product });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await findVisibleProduct(req, res);
  if (!product) return;

  const limit = parsePageValue(req.query.limit, 8);
  if (limit === null || limit > 20) {
    return res.status(400).json({ success: false, message: "limit must be between 1 and 20" });
  }

  const related = await Product.find({
    _id: { $ne: product._id },
    status: "active",
    $or: [{ category: product.category }, { brand: product.brand }],
  })
    .sort({ featured: -1, createdAt: -1 })
    .limit(limit);
  return res.status(200).json({ success: true, data: { products: related } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).user;
  if (!user || !["admin", "seller"].includes(user.role)) {
    return res.status(403).json({ success: false, message: "You cannot create products" });
  }

  const payload = productPayload(req.body);
  const slugSource = typeof payload.slug === "string" ? payload.slug : String(payload.name || "");
  payload.slug = await createUniqueSlug(slugSource);
  const product = await Product.create({ ...payload, seller: user._id });
  return res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await findVisibleProduct(req, res);
  if (!product) return;

  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!userCanManageProduct(user, product)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const payload = productPayload(req.body);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ success: false, message: "No editable product fields provided" });
  }
  if (payload.slug !== undefined || payload.name !== undefined) {
    const slugSource =
      typeof payload.slug === "string" ? payload.slug : String(payload.name ?? product.name);
    payload.slug = await createUniqueSlug(slugSource, product._id);
  }

  Object.assign(product, payload);
  await product.save();
  return res.status(200).json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findVisibleProduct(req, res);
  if (!product) return;

  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!userCanManageProduct(user, product)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  await Product.deleteOne({ _id: product._id });
  return res.status(200).json({ success: true, message: "Product deleted" });
});
