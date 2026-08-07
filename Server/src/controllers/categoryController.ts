import { Request, Response } from "express";
import Category from "../models/Category";

export async function getCategories(req: Request, res: Response) {
  const categories = await Category.find().sort({ display_order: 1, name: 1 });
  return res.status(200).json({ success: true, data: categories });
}

export async function getCategoryById(req: Request, res: Response) {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: "Category not found" });
  return res.status(200).json({ success: true, data: category });
}

export async function createCategory(req: Request, res: Response) {
  const category = await Category.create(req.body);
  return res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req: Request, res: Response) {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ success: false, message: "Category not found" });
  return res.status(200).json({ success: true, data: category });
}

export async function deleteCategory(req: Request, res: Response) {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: "Category not found" });
  return res.status(200).json({ success: true, message: "Category deleted" });
}
