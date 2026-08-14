import { Request, Response } from "express";
import Enquiry from "../models/Enquiry";
import { sendEmail } from "../utils/mail";

export async function createEnquiry(req: Request, res: Response) {
  const enquiry = await Enquiry.create(req.body);

  const notificationEmail = process.env.ENQUIRY_NOTIFICATION_EMAIL || "pccaresagar@yahoo.com";
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
  const query: any = {};
  if (req.query.search) {
    const term = String(req.query.search);
    query.$or = [
      { name: new RegExp(term, "i") },
      { email: new RegExp(term, "i") },
      { phone: new RegExp(term, "i") },
      { message: new RegExp(term, "i") },
    ];
  }
  if (req.query.status) query.status = req.query.status;
  if (req.query.dateFrom) query.createdAt = { ...query.createdAt, $gte: new Date(`${req.query.dateFrom}T00:00:00`) };
  if (req.query.dateTo) query.createdAt = { ...query.createdAt, $lte: new Date(`${req.query.dateTo}T23:59:59`) };

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const skip = (page - 1) * pageSize;

  const enquiries = await Enquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize);
  const totalCount = await Enquiry.countDocuments(query);

  return res.status(200).json({ success: true, data: { enquiries, totalCount } });
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
