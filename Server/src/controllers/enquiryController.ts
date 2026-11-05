import { Request, Response } from "express";
import Enquiry from "../models/Enquiry";
import Settings from "../models/Settings";
import { sendEmail } from "../utils/mail";
import { parseReportDateRange } from "../utils/reporting";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createEnquiry(req: Request, res: Response) {
  const enquiry = await Enquiry.create({
    name: String(req.body.name).trim(),
    email: req.body.email || null,
    phone: req.body.phone || null,
    company: req.body.company || null,
    subject: req.body.subject || null,
    message: String(req.body.message).trim(),
    product_id: req.body.product_id || null,
    product_name: req.body.product_name || null,
    contactMethod: req.body.contactMethod || null,
    status: "new",
  });

  const settings = await Settings.findOne().select("email");
  const notificationEmail = settings?.email ||
    process.env.ENQUIRY_NOTIFICATION_EMAIL ||
    "abhinandansoni100@gmail.com";
  const subject = `New enquiry from ${enquiry.name}`;
  const bodyLines = [
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email ?? "N/A"}`,
    `Phone: ${enquiry.phone ?? "N/A"}`,
    enquiry.company ? `Company: ${enquiry.company}` : "",
    `Preferred contact via: ${enquiry.contactMethod ?? "N/A"}`,
    `Subject: ${enquiry.subject ?? "N/A"}`,
    `Message: ${enquiry.message}`,
    enquiry.product_name ? `Product: ${enquiry.product_name}` : "",
    enquiry.product_id ? `Product ID: ${enquiry.product_id}` : "",
  ].filter(Boolean);

  const text = bodyLines.join("\n");

  try {
    await sendEmail({
      to: notificationEmail,
      subject,
      text,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send enquiry notification email:", error);
  }

  return res.status(201).json({ success: true, data: enquiry });
}

export async function getEnquiries(req: Request, res: Response) {
  const query: Record<string, unknown> = {};
  if (req.query.search !== undefined) {
    if (typeof req.query.search !== "string" || req.query.search.trim().length > 100) {
      return res.status(400).json({ success: false, message: "search must be a string of at most 100 characters" });
    }
    const term = escapeRegex(req.query.search.trim());
    if (!term) return res.status(400).json({ success: false, message: "search cannot be empty" });
    query.$or = [
      { name: new RegExp(term, "i") },
      { email: new RegExp(term, "i") },
      { phone: new RegExp(term, "i") },
      { message: new RegExp(term, "i") },
    ];
  }
  if (req.query.status !== undefined) {
    if (req.query.status !== "new" && req.query.status !== "read") {
      return res.status(400).json({ success: false, message: "status must be new or read" });
    }
    query.status = req.query.status;
  }
  if (req.query.dateFrom !== undefined || req.query.dateTo !== undefined) {
    const range = parseReportDateRange(req.query.dateFrom, req.query.dateTo);
    if (!range) return res.status(400).json({ success: false, message: "Invalid enquiry date range" });
    query.createdAt = { $gte: range.from, $lt: range.to };
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ success: false, message: "Invalid page or pageSize" });
  }
  const skip = (page - 1) * pageSize;

  const enquiries = await Enquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize);
  const totalCount = await Enquiry.countDocuments(query);

  return res.status(200).json({
    success: true,
    data: { enquiries, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
  });
}

export async function getEnquiryById(req: Request, res: Response) {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
  return res.status(200).json({ success: true, data: enquiry });
}

export async function markEnquiryAsRead(req: Request, res: Response) {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: "read" }, { new: true });
  if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
  return res.status(200).json({ success: true, data: enquiry });
}

export async function deleteEnquiry(req: Request, res: Response) {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
  return res.status(200).json({ success: true, message: "Enquiry deleted" });
}
