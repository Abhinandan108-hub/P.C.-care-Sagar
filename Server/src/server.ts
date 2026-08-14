import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { connectDatabase } from "./config/database";
import { ensureDefaultAppData } from "./utils/initData";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import brandRoutes from "./routes/brandRoutes";
import enquiryRoutes from "./routes/enquiryRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import mongoose from "mongoose";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 4000;
// Enable CORS for the client dev server
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/settings", settingsRoutes);

app.use(errorHandler);

connectDatabase()
  .then(async () => {
    await ensureDefaultAppData();
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    console.warn("Starting server without database connection. Read-only endpoints will return fallback data.");
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      if (mongoose.connection.readyState !== 1) {
        console.log("Warning: MongoDB is not connected. Some endpoints may return empty or limited data.");
      }
    });
  });
