import { Request, Response } from "express";
import Product from "../models/Product";
import { AuthRequest } from "../middlewares/auth";

import mongoose from "mongoose";

export async function getProducts(req: Request, res: Response) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({
      success: true,
      data: { products: [], totalCount: 0 },
    });
  }

  const search = (req.query.search as string) || "";
  const filters: any = {};

  if (search) {
    filters.$or = [
      { name: new RegExp(search, "i") },
      { brand: new RegExp(search, "i") },
      { category: new RegExp(search, "i") },
    ];
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const skip = (page - 1) * pageSize;

  if (req.query.status) filters.status = req.query.status;
  else if (!(req as AuthRequest).user) filters.status = "active";
  if (req.query.category) filters.category = req.query.category;
  if (req.query.brand) filters.brand = req.query.brand;
  if (req.query.availability) filters.availability = req.query.availability;

  if ((req as AuthRequest).user?.role === "seller") {
    filters.seller = (req as AuthRequest).user!._id;
  }

  try {
    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);
    const totalCount = await Product.countDocuments(filters);

    return res.status(200).json({ success: true, data: { products, totalCount } });
  } catch (error) {
    console.error("Product lookup failed:", error);
    return res.status(200).json({
      success: true,
      data: { products: [], totalCount: 0 },
    });
  }
}

export async function getProductById(req: Request, res: Response) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  if ((req as AuthRequest).user?.role === "seller" && product.seller.toString() !== (req as AuthRequest).user!._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  return res.status(200).json({ success: true, data: product });
}

export async function createProduct(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

  const product = await Product.create({ ...req.body, seller: user._id });
  return res.status(201).json({ success: true, data: product });
}

export async function updateProduct(req: Request, res: Response) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (user.role === "seller" && product.seller.toString() !== user._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  Object.assign(product, req.body);
  await product.save();
  return res.status(200).json({ success: true, data: product });
}

export async function deleteProduct(req: Request, res: Response) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (user.role === "seller" && product.seller.toString() !== user._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  await Product.deleteOne({ _id: product._id });
  return res.status(200).json({ success: true, message: "Product deleted" });
}
