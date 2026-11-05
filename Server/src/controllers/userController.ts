
import { NextFunction, Request, RequestHandler, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import User, { UserRole } from "../models/User";
import RefreshSession from "../models/RefreshSession";
import { AuthRequest } from "../middlewares/auth";
import Order from "../models/Order";
import ServiceRequest from "../models/ServiceRequest";
import BulkEnquiry from "../models/BulkEnquiry";
import { createEmailVerification } from "./authController";

const allowedRoles: UserRole[] = [
  "admin",
  "customer",
  "seller",
  "technician",
];

const allowedPermissions = [
  "orders.read",
  "orders.update",
  "products.manage",
  "services.manage",
  "enquiries.manage",
  "customers.read",
];

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function publicUserFields() {
  return "-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires";
}

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

export async function getProfile(req: AuthRequest, res: Response) {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    for (const field of ["name", "phone", "company"] as const) {
      const value = req.body[field];
      if (value === undefined) continue;
      if (value === null && field !== "name") {
        req.user![field] = null;
        continue;
      }
      if (typeof value !== "string" || (field === "name" && !value.trim())) {
        return res.status(400).json({ success: false, message: `Valid ${field} is required` });
      }
      if (field === "name") {
        req.user!.name = value.trim();
      } else {
        req.user![field] = value.trim() || null;
      }
    }

    await req.user!.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        isActive: req.user!.isActive,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({ success: false, message: "Invalid page or pageSize" });
    }
    const filter: Record<string, unknown> = {};
    if (typeof req.query.role === "string" && allowedRoles.includes(req.query.role as UserRole)) {
      filter.role = req.query.role;
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      if (req.query.search.trim().length > 100) {
        return res.status(400).json({ success: false, message: "search cannot exceed 100 characters" });
      }
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: new RegExp(escaped, "i") },
        { email: new RegExp(escaped, "i") },
        { phone: new RegExp(escaped, "i") },
        { company: new RegExp(escaped, "i") },
      ];
    }
    const users = await User.find(filter)
      .select(publicUserFields())
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    const totalCount = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: { users, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    const user = await User.findById(req.params.id)
      .select(publicUserFields());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }
}

export const getCustomers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ success: false, message: "Invalid page or pageSize" });
  }
  const filter: Record<string, unknown> = { role: "customer" };
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    if (req.query.search.trim().length > 100) {
      return res.status(400).json({ success: false, message: "search cannot exceed 100 characters" });
    }
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: new RegExp(escaped, "i") },
      { email: new RegExp(escaped, "i") },
      { phone: new RegExp(escaped, "i") },
      { company: new RegExp(escaped, "i") },
    ];
  }
  const [customers, totalCount] = await Promise.all([
    User.find(filter)
      .select(publicUserFields())
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    User.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: { customers, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
  });
});

export const getStaff = asyncHandler(async (_req, res) => {
  const staff = await User.find({ role: { $in: ["admin", "seller", "technician"] } })
    .select(publicUserFields())
    .sort({ role: 1, name: 1 });
  return res.status(200).json({ success: true, data: staff });
});

export async function createStaff(req: Request, res: Response) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").toLowerCase().trim();
  const role = req.body.role as UserRole;
  const permissions = req.body.permissions ?? [];
  if (!name || !email || !["seller", "technician"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and staff role (seller or technician) are required",
    });
  }
  if (
    !Array.isArray(permissions) ||
    permissions.some((permission: unknown) => !allowedPermissions.includes(String(permission))) ||
    new Set(permissions).size !== permissions.length
  ) {
    return res.status(400).json({ success: false, message: "Permissions contain invalid or duplicate values" });
  }
  try {
    const temporaryPassword = crypto.randomBytes(24).toString("base64url");
    const staff = await User.create({
      name,
      email,
      password: await bcrypt.hash(temporaryPassword, 12),
      phone: req.body.phone || null,
      role,
      isActive: true,
      emailVerified: false,
      permissions,
    });
    try {
      await createEmailVerification(staff);
    } catch (error) {
      console.error("Staff account was created but verification email failed:", error);
      return res.status(503).json({
        success: false,
        message: "Staff account created, but verification email could not be sent. Resend verification after fixing email settings.",
        data: { id: staff._id, email: staff.email },
      });
    }
    return res.status(201).json({
      success: true,
      message: "Staff account created. Verification email has been sent.",
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
        emailVerified: staff.emailVerified,
        permissions: staff.permissions,
      },
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }
    console.error("Staff account creation failed:", error);
    return res.status(500).json({ success: false, message: "Unable to create staff account" });
  }
}

export const updateUserInformation = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }
  const updates: Record<string, unknown> = {};
  for (const field of ["name", "phone", "company"] as const) {
    if (req.body[field] !== undefined) {
      if (req.body[field] === null && field !== "name") {
        updates[field] = null;
        continue;
      }
      if (typeof req.body[field] !== "string" || (field === "name" && !req.body[field].trim())) {
        return res.status(400).json({ success: false, message: `${field} is invalid` });
      }
      updates[field] = req.body[field].trim() || (field === "name" ? "" : null);
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: "No customer information provided" });
  }
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: "customer" },
    updates,
    { new: true, runValidators: true }
  ).select(publicUserFields());
  if (!user) return res.status(404).json({ success: false, message: "Customer not found" });
  return res.status(200).json({ success: true, data: user });
});

export const getCustomerHistory = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }
  const user = await User.findOne({ _id: req.params.id, role: "customer" }).select("_id name email");
  if (!user) return res.status(404).json({ success: false, message: "Customer not found" });
  const [orders, serviceRequests, bulkEnquiries] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(100),
    ServiceRequest.find({ customer: user._id }).sort({ createdAt: -1 }).limit(100),
    BulkEnquiry.find({ customer: user._id }).sort({ createdAt: -1 }).limit(100),
  ]);
  return res.status(200).json({
    success: true,
    data: { customer: user, orders, serviceRequests, bulkEnquiries },
  });
});

export async function updateUserRole(req: Request, res: Response) {
  try {
    const role = req.body.role as UserRole;

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if ((req as AuthRequest).user?._id.toString() === req.params.id) {
      return res.status(409).json({ success: false, message: "You cannot change your own role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select(publicUserFields());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update user role",
    });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const isActive = req.body.isActive;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if ((req as AuthRequest).user?._id.toString() === req.params.id && !isActive) {
      return res.status(409).json({ success: false, message: "You cannot deactivate your own account" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select(publicUserFields());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!isActive) {
      await RefreshSession.updateMany(
        { userId: user._id, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Account activated successfully"
        : "Account deactivated successfully",
      data: user,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update account status",
    });
  }
}

export const updateUserPermissions = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }
  if (
    !Array.isArray(req.body.permissions) ||
    req.body.permissions.some((permission: unknown) => !allowedPermissions.includes(String(permission))) ||
    new Set(req.body.permissions).size !== req.body.permissions.length
  ) {
    return res.status(400).json({ success: false, message: "Permissions contain invalid or duplicate values" });
  }
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: { $in: ["seller", "technician"] } },
    { $set: { permissions: req.body.permissions } },
    { new: true, runValidators: true }
  ).select(publicUserFields());
  if (!user) return res.status(404).json({ success: false, message: "Staff account not found" });
  return res.status(200).json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  // Use deactivation instead of permanent deletion so that
  // order, enquiry and service history can remain linked.
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }
  if ((req as AuthRequest).user?._id.toString() === req.params.id) {
    return res.status(409).json({ success: false, message: "You cannot deactivate your own account" });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true, runValidators: true }
  ).select(publicUserFields());
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  await RefreshSession.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return res.status(200).json({
    success: true,
    message: "Account deactivated successfully",
    data: user,
  });
});
