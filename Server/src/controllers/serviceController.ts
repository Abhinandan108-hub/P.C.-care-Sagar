import { randomBytes } from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { AuthRequest } from "../middlewares/auth";
import ServiceRequest, { ServiceStatus } from "../models/ServiceRequest";
import User from "../models/User";
import { uploadServiceImage } from "../utils/cloudinary";
import { notifyCustomer } from "../utils/notifications";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function getUser(req: Request) {
  return (req as AuthRequest).user!;
}

async function notifyServiceCustomer(
  service: InstanceType<typeof ServiceRequest>,
  subject: string,
  message: string
) {
  try {
    const customer = await User.findById(service.customer).select("email phone");
    if (!customer) {
      console.error(`Could not notify customer for service ${service.ticketNumber}: customer not found`);
      return;
    }
    await notifyCustomer({
      email: customer.email,
      phone: customer.phone,
      subject,
      message: `${message}\nTicket number: ${service.ticketNumber}`,
    });
  } catch (error) {
    console.error(`Could not send service notification for ${service.ticketNumber}:`, error);
  }
}

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function objectId(id: mongoose.Types.ObjectId | string) {
  return new mongoose.Types.ObjectId(id.toString());
}

function ticketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `SR-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function getUploadedFiles(req: Request) {
  return (req.files as Express.Multer.File[] | undefined) || [];
}

async function uploadRequestImages(files: Express.Multer.File[]) {
  const images = [];
  for (const file of files) {
    const uploaded = await uploadServiceImage(file.buffer);
    images.push({
      url: uploaded.url,
      publicId: uploaded.public_id,
      uploadedAt: new Date(),
    });
  }
  return images;
}

async function getVisibleRequest(req: Request, id: string) {
  if (!validId(id)) return null;
  const user = getUser(req);
  const filter: Record<string, unknown> = { _id: id };
  if (user.role === "customer") filter.customer = user._id;
  if (user.role === "technician") filter.technician = user._id;
  return ServiceRequest.findOne(filter);
}

function addHistory(
  service: InstanceType<typeof ServiceRequest>,
  user: InstanceType<typeof User>,
  status: ServiceStatus,
  message: string
) {
  service.history.push({
    status,
    message,
    changedBy: objectId(user._id),
    changedAt: new Date(),
  });
}

function getServiceDataForUser(
  service: InstanceType<typeof ServiceRequest>,
  user: InstanceType<typeof User>
) {
  const data = service.toObject();
  if (user.role === "customer") {
    data.notes = data.notes.filter((note) => !note.internal);
  }
  return data;
}

export const createServiceRequest = asyncHandler(async (req, res) => {
  const { deviceType, brand, model, serialNumber, problemDescription } = req.body;
  const files = getUploadedFiles(req);
  const images = await uploadRequestImages(files);
  const user = getUser(req);
  const service = await ServiceRequest.create({
    ticketNumber: ticketNumber(),
    customer: objectId(user._id),
    deviceType,
    brand: brand || null,
    model: model || null,
    serialNumber: serialNumber || null,
    problemDescription,
    images,
    history: [
      {
        status: "requested",
        message: "Service request created",
        changedBy: user._id,
        changedAt: new Date(),
      },
    ],
  });
  await notifyServiceCustomer(
    service,
    "Service request received",
    "Your IT service request has been received."
  );
  return res.status(201).json({ success: true, data: service });
});

export const getMyServiceHistory = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ success: false, message: "Invalid page or pageSize" });
  }
  const filter: Record<string, unknown> = {};
  const user = getUser(req);
  if (user.role === "customer") filter.customer = user._id;
  if (user.role === "technician") filter.technician = user._id;
  if (typeof req.query.status === "string") filter.status = req.query.status;
  const [requests, totalCount] = await Promise.all([
    ServiceRequest.find(filter)
      .populate("customer", "name email")
      .populate("technician", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    ServiceRequest.countDocuments(filter),
  ]);
  const visibleRequests = requests.map((request) => {
    const data = request.toObject();
    if (user.role === "customer") {
      data.notes = data.notes.filter((note) => !note.internal);
    }
    return data;
  });
  return res.status(200).json({
    success: true,
    data: {
      requests: visibleRequests,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  });
});

export const getServiceRequest = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid service request ID" });
  }
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  return res.status(200).json({ success: true, data: getServiceDataForUser(service, getUser(req)) });
});

export const updateServiceRequest = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid service request ID" });
  }
  const user = getUser(req);
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (["completed", "cancelled"].includes(service.status)) {
    return res.status(409).json({ success: false, message: "Closed requests cannot be edited" });
  }
  if (user.role === "customer" && (service.status !== "requested" || service.technician)) {
    return res.status(409).json({ success: false, message: "Request can only be edited before technician assignment" });
  }
  if (!["customer", "admin", "technician"].includes(user.role)) {
    return res.status(403).json({ success: false, message: "You cannot update this request" });
  }

  if (req.body.deviceType !== undefined) service.deviceType = req.body.deviceType;
  if (req.body.brand !== undefined) service.brand = req.body.brand;
  if (req.body.model !== undefined) service.model = req.body.model;
  if (req.body.serialNumber !== undefined) service.serialNumber = req.body.serialNumber;
  if (req.body.problemDescription !== undefined) {
    service.problemDescription = req.body.problemDescription;
  }
  const files = getUploadedFiles(req);
  if (service.images.length + files.length > 10) {
    return res.status(400).json({ success: false, message: "A request can have up to 10 images" });
  }
  const newImages = await uploadRequestImages(files);
  service.images.push(...newImages);
  await service.save();
  return res.status(200).json({
    success: true,
    data: getServiceDataForUser(service, user),
  });
});

export const assignTechnician = asyncHandler(async (req, res) => {
  if (!validId(req.params.id) || !validId(req.body.technicianId)) {
    return res.status(400).json({ success: false, message: "Valid service and technician IDs are required" });
  }
  const [service, technician] = await Promise.all([
    ServiceRequest.findById(req.params.id),
    User.findOne({ _id: req.body.technicianId, role: "technician", isActive: true }),
  ]);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (!technician) return res.status(404).json({ success: false, message: "Active technician not found" });
  if (["completed", "cancelled"].includes(service.status)) {
    return res.status(409).json({ success: false, message: "Completed or cancelled requests cannot be assigned" });
  }

  service.technician = objectId(technician._id);
  service.status = "assigned";
  addHistory(service, getUser(req), "assigned", `Assigned to ${technician.name}`);
  await service.save();
  await notifyServiceCustomer(service, "Technician assigned", `Technician ${technician.name} has been assigned to your request.`);
  return res.status(200).json({ success: true, data: service });
});

export const updateServiceStatus = asyncHandler(async (req, res) => {
  const allowedStatuses: ServiceStatus[] = [
    "diagnosing",
    "awaiting_approval",
    "in_progress",
    "completed",
    "cancelled",
  ];
  const status = req.body.status as ServiceStatus;
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid service status" });
  }
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (["completed", "cancelled"].includes(service.status)) {
    return res.status(409).json({ success: false, message: "Request is already complete" });
  }
  const nextStatuses: Record<string, ServiceStatus[]> = {
    assigned: ["diagnosing", "cancelled"],
    diagnosing: ["awaiting_approval", "in_progress", "cancelled"],
    awaiting_approval: ["cancelled"],
    in_progress: ["completed", "cancelled"],
  };
  if (!nextStatuses[service.status]?.includes(status)) {
    return res.status(409).json({
      success: false,
      message: `Cannot change service status from ${service.status} to ${status}`,
    });
  }
  if (status === "completed" && service.finalCost === null) {
    return res.status(409).json({ success: false, message: "Set the final service cost before completion" });
  }

  service.status = status;
  addHistory(service, getUser(req), status, String(req.body.message || `Status changed to ${status}`));
  await service.save();
  await notifyServiceCustomer(
    service,
    status === "completed" ? "Service completed" : "Service status update",
    `Your service request status is now ${status}.`
  );
  return res.status(200).json({ success: true, data: service });
});

export const addServiceNote = asyncHandler(async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message || message.length > 1000) {
    return res.status(400).json({ success: false, message: "Note must be between 1 and 1000 characters" });
  }
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  const user = getUser(req);
  if (["completed", "cancelled"].includes(service.status)) {
    return res.status(409).json({ success: false, message: "Cannot add a note to a closed request" });
  }
  service.notes.push({
    author: objectId(user._id),
    authorName: user.name,
    authorRole: user.role,
    message,
    internal: user.role !== "customer" && req.body.internal === true,
    createdAt: new Date(),
  });
  await service.save();
  return res.status(201).json({ success: true, data: service.notes[service.notes.length - 1] });
});

export const setServiceEstimate = asyncHandler(async (req, res) => {
  const cost = Number(req.body.estimatedCost);
  if (!Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ success: false, message: "estimatedCost must be zero or more" });
  }
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (["completed", "cancelled"].includes(service.status)) {
    return res.status(409).json({ success: false, message: "Cannot change estimate for a closed request" });
  }
  service.estimatedCost = cost;
  service.status = "awaiting_approval";
  addHistory(service, getUser(req), service.status, `Service estimate updated to INR ${cost.toFixed(2)}`);
  await service.save();
  await notifyServiceCustomer(
    service,
    "Service estimate ready",
    `The estimated service charge is INR ${cost.toFixed(2)}. Please review it in your account.`
  );
  return res.status(200).json({ success: true, data: service });
});

export const setFinalServiceCost = asyncHandler(async (req, res) => {
  const cost = Number(req.body.finalCost);
  if (!Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ success: false, message: "finalCost must be zero or more" });
  }
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (["completed", "cancelled"].includes(service.status)) {
    return res.status(409).json({ success: false, message: "Cannot change cost for a closed request" });
  }
  if (service.status !== "in_progress") {
    return res.status(409).json({ success: false, message: "Set the final cost while the service is in progress" });
  }
  service.finalCost = cost;
  addHistory(service, getUser(req), service.status, `Final service cost set to INR ${cost.toFixed(2)}`);
  await service.save();
  return res.status(200).json({ success: true, data: service });
});

export const getServiceTracking = asyncHandler(async (req, res) => {
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  return res.status(200).json({
    success: true,
    data: {
      ticketNumber: service.ticketNumber,
      status: service.status,
      history: service.history,
      updatedAt: service.updatedAt,
    },
  });
});

export const completeService = asyncHandler(async (req, res) => {
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (service.status === "cancelled") {
    return res.status(409).json({ success: false, message: "Cancelled request cannot be completed" });
  }
  if (service.finalCost === null || service.finalCost === undefined) {
    return res.status(409).json({ success: false, message: "Set the final service cost before completion" });
  }
  if (service.status !== "in_progress") {
    return res.status(409).json({ success: false, message: "Service must be in progress before completion" });
  }

  service.status = "completed";
  addHistory(service, getUser(req), "completed", "Service completed");
  await service.save();
  await notifyServiceCustomer(
    service,
    "Service completed",
    `Your service is complete. Final charge: INR ${service.finalCost!.toFixed(2)}.`
  );
  return res.status(200).json({
    success: true,
    data: { ticketNumber: service.ticketNumber, status: service.status, billingStatus: service.billingStatus },
  });
});

export const cancelServiceRequest = asyncHandler(async (req, res) => {
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (!["requested", "assigned"].includes(service.status)) {
    return res.status(409).json({ success: false, message: "Service can no longer be cancelled" });
  }
  service.status = "cancelled";
  addHistory(service, getUser(req), "cancelled", "Service request cancelled by customer");
  await service.save();
  await notifyServiceCustomer(service, "Service request cancelled", "Your service request has been cancelled.");
  return res.status(200).json({
    success: true,
    data: getServiceDataForUser(service, getUser(req)),
  });
});

export const approveServiceEstimate = asyncHandler(async (req, res) => {
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (getUser(req).role !== "customer") {
    return res.status(403).json({ success: false, message: "Only the customer can approve the estimate" });
  }
  if (service.status !== "awaiting_approval" || service.estimatedCost === null) {
    return res.status(409).json({ success: false, message: "There is no service estimate to approve" });
  }
  service.status = "in_progress";
  addHistory(service, getUser(req), "in_progress", "Customer approved the service estimate");
  await service.save();
  await notifyServiceCustomer(service, "Service work started", "Your estimate was approved and service work has started.");
  return res.status(200).json({
    success: true,
    data: getServiceDataForUser(service, getUser(req)),
  });
});

export const getServiceBilling = asyncHandler(async (req, res) => {
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  return res.status(200).json({
    success: true,
    data: {
      ticketNumber: service.ticketNumber,
      customer: service.customer,
      deviceType: service.deviceType,
      brand: service.brand,
      model: service.model,
      estimatedCost: service.estimatedCost,
      finalCost: service.finalCost,
      currency: service.currency,
      billingStatus: service.billingStatus,
    },
  });
});

export const downloadServiceBill = asyncHandler(async (req, res) => {
  const service = await getVisibleRequest(req, req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (service.finalCost === null || service.finalCost === undefined) {
    return res.status(409).json({ success: false, message: "Final service bill is not ready" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${service.ticketNumber}-bill.pdf"`);
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(22).text("P.C. Care Sagar - Service Bill");
  pdf.moveDown();
  pdf.fontSize(12).text(`Ticket: ${service.ticketNumber}`);
  pdf.text(`Date: ${service.updatedAt.toLocaleDateString("en-IN")}`);
  pdf.text(`Device: ${service.brand || ""} ${service.model || service.deviceType}`);
  pdf.moveDown().text("Reported problem:");
  pdf.text(service.problemDescription);
  pdf.moveDown();
  if (service.estimatedCost !== null) {
    pdf.text(`Estimate: INR ${Number(service.estimatedCost).toFixed(2)}`);
  }
  pdf.fontSize(14).text(`Final service cost: INR ${Number(service.finalCost).toFixed(2)}`);
  pdf.text(`Billing status: ${service.billingStatus}`);
  pdf.end();
});

export const markServiceBillPaid = asyncHandler(async (req, res) => {
  const service = await ServiceRequest.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service request not found" });
  if (service.status !== "completed" || service.finalCost === null) {
    return res.status(409).json({ success: false, message: "Complete the service and set final cost first" });
  }
  service.billingStatus = "paid";
  await service.save();
  return res.status(200).json({ success: true, data: service });
});
