import { randomBytes } from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import BulkEnquiry from "../models/BulkEnquiry";
import Order from "../models/Order";
import PaymentTransaction from "../models/PaymentTransaction";
import Product from "../models/Product";
import User from "../models/User";
import { AuthRequest } from "../middlewares/auth";
import { sendEmail } from "../utils/mail";
import { notifyCustomer } from "../utils/notifications";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function currentUser(req: Request) {
  return (req as AuthRequest).user!;
}

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function makeReference(prefix: "BE" | "QT") {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${date}-${random}`;
}

function getAddressError(address: Record<string, unknown>) {
  const required = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "country",
  ];
  for (const field of required) {
    if (typeof address[field] !== "string" || !address[field].trim()) {
      return `shippingAddress.${field} is required`;
    }
  }
  return null;
}

async function findEnquiryForUser(req: Request, id: string) {
  if (!validId(id)) return null;
  const user = currentUser(req);
  const filter: Record<string, unknown> = { _id: id };
  if (user.role === "customer") filter.customer = user._id;
  if (user.role === "seller") filter.assignedTo = user._id;
  return BulkEnquiry.findOne(filter);
}

async function findQuotation(req: Request, id: string, quotationId: string) {
  const enquiry = await findEnquiryForUser(req, id);
  if (!enquiry) return { enquiry: null, quotation: null };
  const quotation = enquiry.quotations.find(
    (item) => item._id?.toString() === quotationId
  ) || null;
  return { enquiry, quotation };
}

type Quotation = InstanceType<typeof BulkEnquiry>["quotations"][number];

async function makePdf(enquiry: InstanceType<typeof BulkEnquiry>, quotation: Quotation) {
  const pdf = new PDFDocument({ margin: 48 });
  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });

  pdf.fontSize(22).text("P.C. Care Sagar - Quotation");
  pdf.moveDown();
  pdf.fontSize(12).text(`Quotation: ${quotation.quotationNumber}`);
  pdf.text(`Enquiry: ${enquiry.referenceNumber}`);
  pdf.text(`Valid until: ${quotation.validUntil.toLocaleDateString("en-IN")}`);
  pdf.moveDown().text(`Customer: ${enquiry.contactName}`);
  pdf.text(`Company: ${enquiry.company}`);
  pdf.text(`Email: ${enquiry.email}`);
  pdf.text(`Phone: ${enquiry.phone}`);
  pdf.moveDown().text("Products:");
  for (const item of quotation.items) {
    pdf.text(
      `${item.name} x ${item.quantity} @ INR ${item.unitPrice.toFixed(2)} = INR ${item.lineTotal.toFixed(2)}`
    );
  }
  pdf.moveDown();
  pdf.text(`Subtotal: INR ${quotation.subtotal.toFixed(2)}`);
  pdf.text(`Shipping: INR ${quotation.shippingCharge.toFixed(2)}`);
  pdf.text(`Discount: - INR ${quotation.discount.toFixed(2)}`);
  pdf.fontSize(14).text(`Total: INR ${quotation.total.toFixed(2)}`);
  if (quotation.notes) pdf.moveDown().fontSize(10).text(`Notes: ${quotation.notes}`);
  pdf.end();
  return finished;
}

function canManage(user: InstanceType<typeof User>, enquiry: InstanceType<typeof BulkEnquiry>) {
  return user.role === "admin" ||
    (user.role === "seller" && enquiry.assignedTo?.toString() === user._id.toString());
}

function getEnquiryData(
  enquiry: InstanceType<typeof BulkEnquiry>,
  user: InstanceType<typeof User>
) {
  const data = enquiry.toObject();
  if (user.role === "customer") {
    data.quotations = data.quotations.filter(
      (quotation) => quotation.status !== "draft" && quotation.status !== "converting"
    );
  }
  return data;
}

export const createBulkEnquiry = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const addressError = getAddressError(req.body.shippingAddress || {});
  if (addressError) return res.status(400).json({ success: false, message: addressError });
  if (!Array.isArray(req.body.items) || req.body.items.length === 0 || req.body.items.length > 50) {
    return res.status(400).json({ success: false, message: "Add between 1 and 50 requested products" });
  }

  const items = [];
  for (const item of req.body.items as Array<{ productId?: string; quantity?: number }>) {
    if (!item.productId || !validId(item.productId)) {
      return res.status(400).json({ success: false, message: "Each item needs a valid productId" });
    }
    if (!Number.isSafeInteger(item.quantity) || Number(item.quantity) < 1) {
      return res.status(400).json({ success: false, message: "Product quantities must be positive integers" });
    }
    const product = await Product.findOne({ _id: item.productId, status: "active" });
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "A requested product does not exist or is inactive",
        data: { productId: item.productId },
      });
    }
    items.push({ product: product._id, name: product.name, quantity: Number(item.quantity) });
  }

  const enquiry = await BulkEnquiry.create({
    referenceNumber: makeReference("BE"),
    customer: user._id,
    contactName: user.name,
    email: user.email,
    phone: req.body.phone.trim(),
    company: String(req.body.company).trim(),
    message: req.body.message || "",
    shippingAddress: req.body.shippingAddress,
    items,
  });
  await notifyCustomer({
    email: user.email,
    phone: req.body.phone,
    subject: "Bulk enquiry received",
    message: `We received your bulk enquiry ${enquiry.referenceNumber}. Our team will contact you soon.`,
  });
  return res.status(201).json({ success: true, data: enquiry });
});

export const getBulkEnquiries = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ success: false, message: "Invalid page or pageSize" });
  }
  const filter: Record<string, unknown> = {};
  if (user.role === "customer") filter.customer = user._id;
  if (user.role === "seller") filter.assignedTo = user._id;
  if (typeof req.query.status === "string") filter.status = req.query.status;
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    if (req.query.search.trim().length > 100) {
      return res.status(400).json({ success: false, message: "search cannot exceed 100 characters" });
    }
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { referenceNumber: new RegExp(escaped, "i") },
      { company: new RegExp(escaped, "i") },
      { email: new RegExp(escaped, "i") },
      { contactName: new RegExp(escaped, "i") },
    ];
  }
  const [enquiries, totalCount] = await Promise.all([
    BulkEnquiry.find(filter)
      .populate("customer", "name email")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    BulkEnquiry.countDocuments(filter),
  ]);
  const visibleEnquiries = enquiries.map((enquiry) => getEnquiryData(enquiry, user));
  return res.status(200).json({
    success: true,
    data: { enquiries: visibleEnquiries, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
  });
});

export const getBulkEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await findEnquiryForUser(req, req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Bulk enquiry not found" });
  await enquiry.populate("customer", "name email");
  await enquiry.populate("assignedTo", "name email role");
  return res.status(200).json({ success: true, data: getEnquiryData(enquiry, currentUser(req)) });
});

export const updateBulkEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await findEnquiryForUser(req, req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Bulk enquiry not found" });
  const user = currentUser(req);
  if (!canManage(user, enquiry) && (enquiry.status !== "new" || enquiry.quotations.length > 0)) {
    return res.status(409).json({ success: false, message: "This enquiry can no longer be edited" });
  }
  if (!canManage(user, enquiry) && user.role !== "customer") {
    return res.status(403).json({ success: false, message: "You cannot update this enquiry" });
  }
  if (req.body.company !== undefined) enquiry.company = req.body.company.trim();
  if (req.body.phone !== undefined) enquiry.phone = req.body.phone.trim();
  if (req.body.message !== undefined) enquiry.message = req.body.message.trim();
  if (req.body.shippingAddress !== undefined) {
    const addressError = getAddressError(req.body.shippingAddress);
    if (addressError) return res.status(400).json({ success: false, message: addressError });
    enquiry.shippingAddress = req.body.shippingAddress;
  }
  await enquiry.save();
  return res.status(200).json({ success: true, data: enquiry });
});

export const setBulkEnquiryProducts = asyncHandler(async (req, res) => {
  const enquiry = await findEnquiryForUser(req, req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Bulk enquiry not found" });
  if (!canManage(currentUser(req), enquiry)) {
    return res.status(403).json({ success: false, message: "Only assigned staff can update requested products" });
  }
  if (enquiry.quotations.some((quotation) => quotation.status !== "draft")) {
    return res.status(409).json({ success: false, message: "Products cannot change after a quotation is sent" });
  }
  if (!Array.isArray(req.body.items) || req.body.items.length === 0 || req.body.items.length > 50) {
    return res.status(400).json({ success: false, message: "Add between 1 and 50 requested products" });
  }
  const items = [];
  for (const item of req.body.items as Array<{ productId?: string; quantity?: number }>) {
    if (!item.productId || !validId(item.productId) || !Number.isSafeInteger(item.quantity) || Number(item.quantity) < 1) {
      return res.status(400).json({ success: false, message: "Each item needs a valid productId and positive quantity" });
    }
    const product = await Product.findOne({ _id: item.productId, status: "active" });
    if (!product) return res.status(400).json({ success: false, message: `Active product not found: ${item.productId}` });
    items.push({ product: product._id, name: product.name, quantity: Number(item.quantity) });
  }
  enquiry.items = items;
  await enquiry.save();
  return res.status(200).json({ success: true, data: enquiry });
});

export const assignBulkEnquiry = asyncHandler(async (req, res) => {
  if (!validId(req.params.id) || !validId(req.body.staffId)) {
    return res.status(400).json({ success: false, message: "Valid enquiry and staff IDs are required" });
  }
  const [enquiry, staff] = await Promise.all([
    BulkEnquiry.findById(req.params.id),
    User.findOne({ _id: req.body.staffId, role: { $in: ["admin", "seller"] }, isActive: true }),
  ]);
  if (!enquiry) return res.status(404).json({ success: false, message: "Bulk enquiry not found" });
  if (!staff) return res.status(404).json({ success: false, message: "Active staff member not found" });
  enquiry.assignedTo = new mongoose.Types.ObjectId(staff._id.toString());
  if (enquiry.status === "new") enquiry.status = "in_review";
  await enquiry.save();
  return res.status(200).json({ success: true, data: enquiry });
});

export const updateBulkEnquiryStatus = asyncHandler(async (req, res) => {
  const allowedStatuses = ["in_review", "closed"];
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: "Status must be in_review or closed" });
  }
  const enquiry = await findEnquiryForUser(req, req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Bulk enquiry not found" });
  if (!canManage(currentUser(req), enquiry)) {
    return res.status(403).json({ success: false, message: "Only assigned staff can update status" });
  }
  if (["converted", "accepted", "rejected"].includes(enquiry.status)) {
    return res.status(409).json({ success: false, message: "Quotation decisions cannot be changed through enquiry status" });
  }
  enquiry.status = req.body.status;
  await enquiry.save();
  return res.status(200).json({ success: true, data: enquiry });
});

export const createQuotation = asyncHandler(async (req, res) => {
  const enquiry = await findEnquiryForUser(req, req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: "Bulk enquiry not found" });
  if (!canManage(currentUser(req), enquiry)) {
    return res.status(403).json({ success: false, message: "Only assigned staff can create quotations" });
  }
  if (["closed", "converted", "rejected"].includes(enquiry.status)) {
    return res.status(409).json({ success: false, message: "This enquiry cannot receive a quotation" });
  }
  if (!Array.isArray(req.body.items) || req.body.items.length !== enquiry.items.length) {
    return res.status(400).json({ success: false, message: "Quotation must price every requested product" });
  }

  const quotedItems = [];
  for (const requested of enquiry.items) {
    const input = (req.body.items as Array<{ productId?: string; unitPrice?: number }>).find(
      (item: { productId?: string }) => item.productId === requested.product.toString()
    );
    if (!input || !Number.isFinite(Number(input.unitPrice)) || Number(input.unitPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: `A valid unitPrice is required for ${requested.name}`,
      });
    }
    quotedItems.push({
      product: requested.product,
      name: requested.name,
      quantity: requested.quantity,
      unitPrice: Number(input.unitPrice),
      lineTotal: Math.round(requested.quantity * Number(input.unitPrice) * 100) / 100,
    });
  }
  const subtotal = Math.round(quotedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  const shippingCharge = Number(req.body.shippingCharge || 0);
  const discount = Number(req.body.discount || 0);
  if (
    !Number.isFinite(shippingCharge) ||
    !Number.isFinite(discount) ||
    shippingCharge < 0 ||
    discount < 0 ||
    discount > subtotal + shippingCharge
  ) {
    return res.status(400).json({ success: false, message: "Shipping or discount amount is invalid" });
  }
  const validDays = Number(req.body.validDays || 7);
  if (!Number.isInteger(validDays) || validDays < 1 || validDays > 90) {
    return res.status(400).json({ success: false, message: "validDays must be between 1 and 90" });
  }
  enquiry.quotations.push({
    quotationNumber: makeReference("QT"),
    items: quotedItems,
    subtotal,
    shippingCharge,
    discount,
    total: Math.round((subtotal + shippingCharge - discount) * 100) / 100,
    notes: req.body.notes || null,
    validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
    status: "draft",
  });
  const quotation = enquiry.quotations[enquiry.quotations.length - 1];
  await enquiry.save();
  return res.status(201).json({ success: true, data: quotation });
});

export const updateQuotation = asyncHandler(async (req, res) => {
  const { enquiry, quotation } = await findQuotation(req, req.params.id, req.params.quotationId);
  if (!enquiry || !quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
  if (!canManage(currentUser(req), enquiry)) {
    return res.status(403).json({ success: false, message: "Only assigned staff can update quotations" });
  }
  if (quotation.status !== "draft") {
    return res.status(409).json({ success: false, message: "Only draft quotations can be changed" });
  }
  if (req.body.items !== undefined) {
    if (!Array.isArray(req.body.items) || req.body.items.length !== enquiry.items.length) {
      return res.status(400).json({ success: false, message: "Quotation must price every requested product" });
    }
    const newItems = [];
    for (const requested of enquiry.items) {
      const input = (req.body.items as Array<{ productId?: string; unitPrice?: number }>).find(
        (item: { productId?: string }) => item.productId === requested.product.toString()
      );
      if (!input || !Number.isFinite(Number(input.unitPrice)) || Number(input.unitPrice) < 0) {
        return res.status(400).json({ success: false, message: `A valid unitPrice is required for ${requested.name}` });
      }
      newItems.push({
        product: requested.product,
        name: requested.name,
        quantity: requested.quantity,
        unitPrice: Number(input.unitPrice),
        lineTotal: Math.round(requested.quantity * Number(input.unitPrice) * 100) / 100,
      });
    }
    quotation.items = newItems;
    quotation.subtotal = Math.round(newItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  }
  if (req.body.shippingCharge !== undefined) quotation.shippingCharge = Number(req.body.shippingCharge);
  if (req.body.discount !== undefined) quotation.discount = Number(req.body.discount);
  if (
    quotation.shippingCharge < 0 ||
    quotation.discount < 0 ||
    quotation.discount > quotation.subtotal + quotation.shippingCharge
  ) {
    return res.status(400).json({ success: false, message: "Shipping or discount amount is invalid" });
  }
  if (req.body.notes !== undefined) quotation.notes = req.body.notes;
  if (req.body.validDays !== undefined) {
    const days = Number(req.body.validDays);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      return res.status(400).json({ success: false, message: "validDays must be between 1 and 90" });
    }
    quotation.validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  quotation.total = Math.round((quotation.subtotal + quotation.shippingCharge - quotation.discount) * 100) / 100;
  await enquiry.save();
  return res.status(200).json({ success: true, data: quotation });
});

export const downloadQuotationPdf = asyncHandler(async (req, res) => {
  const { enquiry, quotation } = await findQuotation(req, req.params.id, req.params.quotationId);
  if (!enquiry || !quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
  if (currentUser(req).role === "customer" && quotation.status === "draft") {
    return res.status(404).json({ success: false, message: "Quotation not found" });
  }
  const pdf = await makePdf(enquiry, quotation);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${quotation.quotationNumber}.pdf"`);
  return res.status(200).send(pdf);
});

export const sendQuotation = asyncHandler(async (req, res) => {
  const { enquiry, quotation } = await findQuotation(req, req.params.id, req.params.quotationId);
  if (!enquiry || !quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
  if (!canManage(currentUser(req), enquiry)) {
    return res.status(403).json({ success: false, message: "Only assigned staff can send quotations" });
  }
  if (quotation.status !== "draft") {
    return res.status(409).json({ success: false, message: "Only draft quotations can be sent" });
  }
  if (quotation.validUntil <= new Date()) {
    return res.status(409).json({ success: false, message: "Quotation expiry date has passed" });
  }

  const pdf = await makePdf(enquiry, quotation);
  await sendEmail({
    to: enquiry.email,
    subject: `Quotation ${quotation.quotationNumber} for ${enquiry.company}`,
    text: [
      `Hello ${enquiry.contactName},`,
      "",
      `Please find quotation ${quotation.quotationNumber} attached.`,
      `Total: INR ${quotation.total.toFixed(2)}`,
      `Valid until: ${quotation.validUntil.toLocaleDateString("en-IN")}`,
      "",
      "Please sign in to your account to accept or reject this quotation.",
    ].join("\n"),
    attachments: [
      {
        filename: `${quotation.quotationNumber}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });
  quotation.status = "sent";
  quotation.sentAt = new Date();
  enquiry.status = "quoted";
  await enquiry.save();
  await notifyCustomer({
    phone: enquiry.phone,
    subject: `Quotation ${quotation.quotationNumber}`,
    message: `Quotation ${quotation.quotationNumber} for ${enquiry.company} is ready. Total: INR ${quotation.total.toFixed(2)}. Please check your email or account to review it.`,
  });
  return res.status(200).json({ success: true, data: quotation, message: "Quotation sent by email" });
});

export const decideQuotation = asyncHandler(async (req, res) => {
  const { enquiry, quotation } = await findQuotation(req, req.params.id, req.params.quotationId);
  if (!enquiry || !quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
  if (currentUser(req).role !== "customer") {
    return res.status(403).json({ success: false, message: "Only the customer can decide on a quotation" });
  }
  if (quotation.status !== "sent") {
    return res.status(409).json({ success: false, message: "Only sent quotations can be accepted or rejected" });
  }
  if (quotation.validUntil <= new Date()) {
    quotation.status = "expired";
    await enquiry.save();
    return res.status(409).json({ success: false, message: "Quotation has expired" });
  }
  if (req.body.decision !== "accepted" && req.body.decision !== "rejected") {
    return res.status(400).json({ success: false, message: "decision must be accepted or rejected" });
  }
  const updated = await BulkEnquiry.findOneAndUpdate(
    {
      _id: enquiry._id,
      customer: currentUser(req)._id,
      quotations: {
        $elemMatch: {
          _id: quotation._id,
          status: "sent",
          validUntil: { $gt: new Date() },
        },
      },
      $and: [
        {
          quotations: {
            $not: { $elemMatch: { status: { $in: ["accepted", "converting", "converted"] } } },
          },
        },
      ],
    },
    {
      $set: {
        "quotations.$.status": req.body.decision,
        "quotations.$.decisionAt": new Date(),
        status: req.body.decision,
      },
    },
    { new: true }
  );
  if (!updated) {
    return res.status(409).json({ success: false, message: "Quotation was already decided or has expired" });
  }
  await notifyCustomer({
    phone: enquiry.phone,
    subject: "Quotation decision received",
    message: `Your quotation ${quotation.quotationNumber} has been ${req.body.decision}.`,
  });
  const updatedQuotation = updated.quotations.find(
    (item) => item._id?.toString() === req.params.quotationId
  );
  return res.status(200).json({ success: true, data: updatedQuotation });
});

export const convertQuotationToOrder = asyncHandler(async (req, res) => {
  const { enquiry, quotation } = await findQuotation(req, req.params.id, req.params.quotationId);
  if (!enquiry || !quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
  if (currentUser(req).role !== "customer") {
    return res.status(403).json({ success: false, message: "Only the customer can convert an accepted quotation" });
  }
  if (quotation.status !== "accepted" || enquiry.status !== "accepted") {
    return res.status(409).json({ success: false, message: "Accept this quotation before converting it" });
  }
  if (quotation.validUntil <= new Date()) {
    quotation.status = "expired";
    enquiry.status = "in_review";
    await enquiry.save();
    return res.status(409).json({ success: false, message: "Quotation has expired" });
  }

  const claimed = await BulkEnquiry.updateOne(
    {
      _id: enquiry._id,
      customer: currentUser(req)._id,
      quotations: {
        $elemMatch: { _id: quotation._id, status: "accepted" },
      },
    },
    { $set: { "quotations.$.status": "converting" } }
  );
  if (claimed.modifiedCount !== 1) {
    return res.status(409).json({ success: false, message: "Quotation is already being converted" });
  }
  quotation.status = "converting";

  const reserved: Array<{ product: mongoose.Types.ObjectId; quantity: number }> = [];
  for (const item of quotation.items) {
    const product = await Product.findOneAndUpdate(
      {
        _id: item.product,
        status: "active",
        availability: "in_stock",
        stock: { $gte: item.quantity },
      },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!product) {
      for (const reservedItem of reserved) {
        await Product.updateOne(
          { _id: reservedItem.product },
          { $inc: { stock: reservedItem.quantity }, $set: { availability: "in_stock" } }
        );
      }
      await BulkEnquiry.updateOne(
        { _id: enquiry._id, "quotations._id": quotation._id },
        { $set: { "quotations.$.status": "accepted" } }
      );
      return res.status(409).json({
        success: false,
        message: "Product stock changed. Contact sales for an updated quotation.",
        data: { productId: item.product.toString() },
      });
    }
    reserved.push({ product: item.product, quantity: item.quantity });
    if (product.stock === 0) {
      await Product.updateOne({ _id: product._id, stock: 0 }, { $set: { availability: "out_of_stock" } });
    }
  }

  const orderNumber = `PC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
  let order;
  try {
    order = await Order.create({
      orderNumber,
      user: currentUser(req)._id,
      items: quotation.items.map((item) => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      shippingAddress: enquiry.shippingAddress,
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "confirmed",
      subtotal: quotation.subtotal,
      shippingCharge: quotation.shippingCharge,
      discount: quotation.discount,
      total: quotation.total,
      notes: `Converted from ${enquiry.referenceNumber}, quotation ${quotation.quotationNumber}`,
      stockReserved: true,
    });
    await PaymentTransaction.create({
      order: order._id,
      user: order.user,
      provider: "cod",
      amount: order.total,
      currency: "INR",
      status: "created",
    });
  } catch (error) {
    if (order) await Order.deleteOne({ _id: order._id });
    if (order) await PaymentTransaction.deleteMany({ order: order._id });
    for (const item of reserved) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity }, $set: { availability: "in_stock" } }
      );
    }
    await BulkEnquiry.updateOne(
      { _id: enquiry._id, "quotations._id": quotation._id },
      { $set: { "quotations.$.status": "accepted" } }
    );
    throw error;
  }

  quotation.status = "converted";
  quotation.convertedOrder = order._id;
  enquiry.status = "converted";
  try {
    await enquiry.save();
  } catch (error) {
    await PaymentTransaction.deleteMany({ order: order._id });
    await Order.deleteOne({ _id: order._id });
    for (const item of reserved) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity }, $set: { availability: "in_stock" } }
      );
    }
    await BulkEnquiry.updateOne(
      { _id: enquiry._id, "quotations._id": quotation._id },
      { $set: { "quotations.$.status": "accepted", status: "accepted" } }
    );
    throw error;
  }
  return res.status(201).json({
    success: true,
    data: { order, quotation },
  });
});
