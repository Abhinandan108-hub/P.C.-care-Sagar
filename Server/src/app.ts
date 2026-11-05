import "express-async-errors";
import "./config/loadEnv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import brandRoutes from "./routes/brandRoutes";
import enquiryRoutes from "./routes/enquiryRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import couponRoutes from "./routes/couponRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import bulkEnquiryRoutes from "./routes/bulkEnquiryRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { addRequestId, auditWriteRequests } from "./middlewares/requestAudit";

const app = express();
const PORT = Number(process.env.PORT || 4000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid TCP port");
}

const allowedOrigins = [
  process.env.FRONTEND_URL || "",
  process.env.CORS_ALLOWED_ORIGINS || "",
]
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== "production" && !allowedOrigins.includes("http://localhost:5173")) {
  allowedOrigins.push("http://localhost:5173");
}

const trustProxySetting = process.env.TRUST_PROXY_HOPS || "0";
const trustProxyHops = Number(trustProxySetting);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
  throw new Error("TRUST_PROXY_HOPS must be a whole number between 0 and 10");
}
if (trustProxyHops > 0) {
  app.set("trust proxy", trustProxyHops);
}

function rateLimitResponse(message: string) {
  return (req: express.Request, res: express.Response) => {
    return res.status(429).json({
      success: false,
      message,
      requestId: (req as express.Request & { requestId?: string }).requestId,
    });
  };
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitResponse("Too many requests. Please try again later."),
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitResponse("Too many authentication attempts. Please try again later."),
});
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitResponse("Too many payment requests. Please try again shortly."),
});

app.disable("x-powered-by");
app.use(addRequestId);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      const error = new Error("Origin not allowed");
      Object.assign(error, { status: 403 });
      return callback(error);
    },
    credentials: true,
  })
);
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buffer) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(hpp());
app.use(mongoSanitize({ replaceWith: "_" }));
morgan.token("request-id", (req) =>
  (req as express.Request & { requestId?: string }).requestId || "unknown"
);
app.use(morgan(":method :url :status :response-time ms request=:request-id"));
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/payments", paymentLimiter);
app.use(auditWriteRequests);

app.get("/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    data: {
      service: "pc-care-sagar-api",
      database: databaseConnected ? "connected" : "disconnected",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bulk-enquiries", bulkEnquiryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
    requestId: (req as express.Request & { requestId?: string }).requestId,
  });
});
app.use(errorHandler);

export default app;
