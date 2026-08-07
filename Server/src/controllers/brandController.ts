import { Request, Response } from "express";
import Brand from "../models/Brand";

export async function getBrands(req: Request, res: Response) {
  const brands = await Brand.find().sort({ name: 1 });
  return res.status(200).json({ success: true, data: brands });
}

export async function getBrandById(req: Request, res: Response) {
  const brand = await Brand.findById(req.params.id);
  if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
  return res.status(200).json({ success: true, data: brand });
}

export async function createBrand(req: Request, res: Response) {
  const brand = await Brand.create(req.body);
  return res.status(201).json({ success: true, data: brand });
}

export async function updateBrand(req: Request, res: Response) {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
  return res.status(200).json({ success: true, data: brand });
}

export async function deleteBrand(req: Request, res: Response) {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
  return res.status(200).json({ success: true, message: "Brand deleted" });
}
