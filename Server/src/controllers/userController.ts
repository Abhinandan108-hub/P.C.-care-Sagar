import { Request, Response } from "express";
import User from "../models/User";

export async function getUsers(req: Request, res: Response) {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: users });
}

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const user = await User.findById(id).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  return res.status(200).json({ success: true, data: user });
}

export async function updateUserRole(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || !["admin", "seller"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({ success: true, data: user });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  return res.status(200).json({ success: true, message: "User deleted" });
}
