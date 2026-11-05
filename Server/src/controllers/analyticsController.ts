import { NextFunction, Request, RequestHandler, Response } from "express";
import PDFDocument from "pdfkit";
import BulkEnquiry from "../models/BulkEnquiry";
import AuditLog from "../models/AuditLog";
import Enquiry from "../models/Enquiry";
import Order from "../models/Order";
import PaymentTransaction from "../models/PaymentTransaction";
import Product from "../models/Product";
import ServiceRequest from "../models/ServiceRequest";
import User from "../models/User";
import { createCsv, parseReportDateRange, ReportDateRange } from "../utils/reporting";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

function dateFilter(range: ReportDateRange) {
  return { createdAt: { $gte: range.from, $lt: range.to } };
}

function paidOrderMatch() {
  return { paymentStatus: { $in: ["paid", "partially_refunded"] } };
}

function netRevenueStages() {
  return [
    {
      $lookup: {
        from: PaymentTransaction.collection.name,
        localField: "_id",
        foreignField: "order",
        as: "payment",
      },
    },
    {
      $addFields: {
        netRevenue: {
          $max: [
            0,
            {
              $subtract: [
                "$total",
                { $ifNull: [{ $arrayElemAt: ["$payment.refundedAmount", 0] }, 0] },
              ],
            },
          ],
        },
      },
    },
  ];
}

async function addRefundAmounts<T extends { _id: unknown; total: number }>(orders: T[]) {
  if (orders.length === 0) return [];
  const paymentRecords = await PaymentTransaction.find({
    order: { $in: orders.map((order) => order._id) },
  }).select("order refundedAmount").lean();
  const refundedByOrder = new Map(
    paymentRecords.map((payment) => [payment.order.toString(), payment.refundedAmount])
  );
  return orders.map((order) => {
    const refundedAmount = refundedByOrder.get(String(order._id)) || 0;
    return {
      ...order,
      refundedAmount,
      netRevenue: Math.round(Math.max(0, order.total - refundedAmount) * 100) / 100,
    };
  });
}

function writeCsv(res: Response, fileName: string, columns: string[], rows: Array<Record<string, unknown>>) {
  const csv = createCsv(columns, rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  return res.status(200).send(`\uFEFF${csv}`);
}

async function writePdf(
  res: Response,
  fileName: string,
  title: string,
  range: ReportDateRange,
  rows: Array<Record<string, unknown>>
) {
  const pdf = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });

  pdf.fontSize(18).text(title);
  pdf.moveDown(0.5).fontSize(10).text(
    `From ${range.from.toISOString().slice(0, 10)} to ${new Date(range.to.getTime() - 1).toISOString().slice(0, 10)}`
  );
  pdf.moveDown();
  for (const row of rows.slice(0, 500)) {
    const line = Object.entries(row).map(([key, value]) => `${key}: ${value ?? ""}`).join(" | ");
    if (pdf.y > 740) pdf.addPage();
    pdf.fontSize(8).text(line, { width: 510 });
    pdf.moveDown(0.3);
  }
  if (rows.length === 0) pdf.fontSize(10).text("No records found for this period.");
  if (rows.length > 500) pdf.moveDown().text("Report limited to the first 500 rows.");
  pdf.end();

  const content = await finished;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  return res.status(200).send(content);
}

function validRangeOrRespond(req: Request, res: Response) {
  const range = parseReportDateRange(req.query.from, req.query.to);
  if (!range) {
    res.status(400).json({
      success: false,
      message: "Use valid from/to dates (YYYY-MM-DD) spanning no more than 366 days.",
    });
    return null;
  }
  return range;
}

export const getOverview = asyncHandler(async (_req, res) => {
  const [
    totalProducts,
    activeProducts,
    totalCustomers,
    totalOrders,
    pendingOrders,
    paidRevenue,
    classicEnquiries,
    bulkEnquiries,
    pendingServices,
    completedServices,
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ status: "active" }),
    User.countDocuments({ role: "customer" }),
    Order.countDocuments({}),
    Order.countDocuments({ status: { $in: ["pending_payment", "confirmed", "processing"] } }),
    Order.aggregate([
      { $match: paidOrderMatch() },
      ...netRevenueStages(),
      { $group: { _id: null, total: { $sum: "$netRevenue" } } },
    ]),
    Enquiry.countDocuments({}),
    BulkEnquiry.countDocuments({}),
    ServiceRequest.countDocuments({ status: { $nin: ["completed", "cancelled"] } }),
    ServiceRequest.countDocuments({ status: "completed" }),
  ]);
  return res.status(200).json({
    success: true,
    data: {
      totalProducts,
      activeProducts,
      totalCustomers,
      totalOrders,
      pendingOrders,
      totalRevenue: Math.round((paidRevenue[0]?.total || 0) * 100) / 100,
      totalEnquiries: classicEnquiries + bulkEnquiries,
      enquiries: { general: classicEnquiries, bulk: bulkEnquiries },
      pendingServiceRequests: pendingServices,
      completedServiceRequests: completedServices,
    },
  });
});

export const getMonthlySales = asyncHandler(async (req, res) => {
  const year = req.query.year === undefined ? new Date().getUTCFullYear() : Number(req.query.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ success: false, message: "year must be between 2000 and 2100" });
  }
  const rows = await Order.aggregate([
    {
      $match: {
        ...paidOrderMatch(),
        createdAt: {
          $gte: new Date(Date.UTC(year, 0, 1)),
          $lt: new Date(Date.UTC(year + 1, 0, 1)),
        },
      },
    },
    ...netRevenueStages(),
    {
      $group: {
        _id: { $month: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$netRevenue" },
      },
    },
  ]);
  const byMonth = new Map<number, { orders: number; revenue: number }>(
    rows.map((row) => [row._id, { orders: row.orders, revenue: Math.round(row.revenue * 100) / 100 }])
  );
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    orders: byMonth.get(index + 1)?.orders || 0,
    revenue: byMonth.get(index + 1)?.revenue || 0,
  }));
  return res.status(200).json({ success: true, data: { year, months } });
});

export const getTopSellingProducts = asyncHandler(async (req, res) => {
  const range = validRangeOrRespond(req, res);
  if (!range) return;
  const limit = Number(req.query.limit) || 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, message: "limit must be between 1 and 100" });
  }
  const products = await Order.aggregate([
    { $match: { ...paidOrderMatch(), ...dateFilter(range) } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        quantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { quantitySold: -1, revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: Product.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $project: {
        productId: "$_id",
        name: { $ifNull: [{ $arrayElemAt: ["$product.name", 0] }, "$name"] },
        quantitySold: 1,
        revenue: { $round: ["$revenue", 2] },
      },
    },
  ]);
  return res.status(200).json({ success: true, data: products });
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = req.query.threshold === undefined ? 5 : Number(req.query.threshold);
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 10000) {
    return res.status(400).json({ success: false, message: "threshold must be between 0 and 10000" });
  }
  const filter = { status: "active", stock: { $lte: threshold } };
  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .select("name slug stock availability category brand")
      .sort({ stock: 1, name: 1 })
      .limit(500),
    Product.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: { threshold, products, totalCount, limit: 500, hasMore: totalCount > products.length },
  });
});

export const getSalesReport = asyncHandler(async (req, res) => {
  const range = validRangeOrRespond(req, res);
  if (!range) return;
  const [allOrders, summaryRows] = await Promise.all([
    Order.find({ ...paidOrderMatch(), ...dateFilter(range) })
      .select("orderNumber createdAt paymentMethod paymentStatus subtotal shippingCharge discount total")
      .sort({ createdAt: 1 })
      .limit(10001)
      .lean(),
    Order.aggregate([
      { $match: { ...paidOrderMatch(), ...dateFilter(range) } },
      ...netRevenueStages(),
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: "$netRevenue" },
          subtotal: { $sum: "$subtotal" },
          discounts: { $sum: "$discount" },
        },
      },
    ]),
  ]);
  const orders = await addRefundAmounts(allOrders.slice(0, 10000));
  const summary = summaryRows[0] || { orders: 0, revenue: 0, subtotal: 0, discounts: 0 };
  return res.status(200).json({
    success: true,
    data: {
      from: range.from,
      to: new Date(range.to.getTime() - 1),
      orderLimit: 10000,
      rowsReturned: orders.length,
      truncated: allOrders.length > 10000,
      summary: { ...summary, revenue: Math.round(summary.revenue * 100) / 100 },
      orders,
    },
  });
});

export const getServiceReport = asyncHandler(async (req, res) => {
  const range = validRangeOrRespond(req, res);
  if (!range) return;
  const [requests, summary] = await Promise.all([
    ServiceRequest.find(dateFilter(range))
      .select("ticketNumber createdAt status deviceType estimatedCost finalCost billingStatus customer technician")
      .populate("customer", "name email")
      .populate("technician", "name")
      .sort({ createdAt: 1 })
      .limit(10001)
      .lean(),
    ServiceRequest.aggregate([
      { $match: dateFilter(range) },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          paidRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$billingStatus", "paid"] },
                { $ifNull: ["$finalCost", 0] },
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);
  return res.status(200).json({
    success: true,
    data: {
      from: range.from,
      to: new Date(range.to.getTime() - 1),
      requestLimit: 10000,
      rowsReturned: Math.min(requests.length, 10000),
      truncated: requests.length > 10000,
      summary: summary.map((row) => ({
        status: row._id,
        count: row.count,
        paidRevenue: Math.round(row.paidRevenue * 100) / 100,
      })),
      requests: requests.slice(0, 10000),
    },
  });
});

export const exportSalesCsv = asyncHandler(async (req, res) => {
  const range = validRangeOrRespond(req, res);
  if (!range) return;
  const allOrders = await Order.find({ ...paidOrderMatch(), ...dateFilter(range) })
    .select("orderNumber createdAt paymentMethod subtotal shippingCharge discount total")
    .sort({ createdAt: 1 })
    .limit(10001)
    .lean();
  const ordersWithRefunds = await addRefundAmounts(allOrders.slice(0, 10000));
  res.setHeader("X-Report-Truncated", allOrders.length > 10000 ? "true" : "false");
  return writeCsv(res, "sales-report.csv", [
    "orderNumber",
    "createdAt",
    "paymentMethod",
    "subtotal",
    "shippingCharge",
    "discount",
    "total",
    "refundedAmount",
    "netRevenue",
  ], ordersWithRefunds.map((order) => ({
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    shippingCharge: order.shippingCharge,
    discount: order.discount,
    total: order.total,
    refundedAmount: order.refundedAmount,
    netRevenue: order.netRevenue,
  })));
});

export const exportServiceCsv = asyncHandler(async (req, res) => {
  const range = validRangeOrRespond(req, res);
  if (!range) return;
  const allRequests = await ServiceRequest.find(dateFilter(range))
    .select("ticketNumber createdAt status deviceType estimatedCost finalCost billingStatus")
    .sort({ createdAt: 1 })
    .limit(10001)
    .lean();
  const requests = allRequests.slice(0, 10000);
  res.setHeader("X-Report-Truncated", allRequests.length > 10000 ? "true" : "false");
  return writeCsv(res, "service-report.csv", [
    "ticketNumber",
    "createdAt",
    "status",
    "deviceType",
    "estimatedCost",
    "finalCost",
    "billingStatus",
  ], requests.map((service) => ({
    ticketNumber: service.ticketNumber,
    createdAt: service.createdAt.toISOString(),
    status: service.status,
    deviceType: service.deviceType,
    estimatedCost: service.estimatedCost,
    finalCost: service.finalCost,
    billingStatus: service.billingStatus,
  })));
});

export const exportSalesPdf = asyncHandler(async (req, res) => {
  const range = validRangeOrRespond(req, res);
  if (!range) return;
  const orders = await Order.find({ ...paidOrderMatch(), ...dateFilter(range) })
    .select("orderNumber createdAt paymentMethod total")
    .sort({ createdAt: 1 })
    .limit(501)
    .lean();
  return writePdf(
    res,
    "sales-report.pdf",
    "P.C. Care Sagar - Sales Report",
    range,
    (await addRefundAmounts(orders)).map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      paymentMethod: order.paymentMethod,
      netRevenue: order.netRevenue,
    }))
  );
});

export const exportServicePdf = asyncHandler(async (req, res) => {
  const range = validRangeOrRespond(req, res);
  if (!range) return;
  const requests = await ServiceRequest.find(dateFilter(range))
    .select("ticketNumber createdAt status deviceType finalCost billingStatus")
    .sort({ createdAt: 1 })
    .limit(501)
    .lean();
  return writePdf(
    res,
    "service-report.pdf",
    "P.C. Care Sagar - Service Report",
    range,
    requests.map((service) => ({
      ticketNumber: service.ticketNumber,
      date: service.createdAt.toISOString(),
      status: service.status,
      deviceType: service.deviceType,
      finalCost: service.finalCost,
      billingStatus: service.billingStatus,
    }))
  );
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 50;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ success: false, message: "pageSize must be between 1 and 100" });
  }
  const filter: Record<string, unknown> = {};
  if (typeof req.query.action === "string" && req.query.action.trim()) {
    const escaped = req.query.action.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.action = new RegExp(escaped, "i");
  }
  if (req.query.statusCode !== undefined) {
    const statusCode = Number(req.query.statusCode);
    if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
      return res.status(400).json({ success: false, message: "statusCode must be a valid HTTP status code" });
    }
    filter.statusCode = statusCode;
  }
  if (req.query.from !== undefined || req.query.to !== undefined) {
    const range = validRangeOrRespond(req, res);
    if (!range) return;
    filter.createdAt = { $gte: range.from, $lt: range.to };
  }
  const [logs, totalCount] = await Promise.all([
    AuditLog.find(filter)
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: { logs, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize) },
  });
});
