import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { signToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already in use" });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed, role: "seller" });
  const token = signToken({ userId: user._id });

  return res.status(201).json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = signToken({ userId: user._id });
  return res.status(200).json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
}

export async function me(req: Request, res: Response) {
  const authReq = req as any;
  return res.status(200).json({ success: true, data: authReq.user });
}
