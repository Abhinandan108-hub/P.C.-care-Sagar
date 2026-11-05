import "./config/loadEnv";
import app from "./app";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { releaseExpiredOrders } from "./controllers/orderController";
import { ensureDefaultAppData } from "./utils/initData";

const PORT = Number(process.env.PORT || 4000);

connectDatabase()
  .then(async () => {
    await ensureDefaultAppData();
    setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        void releaseExpiredOrders().catch((error) => {
          console.error("Failed to release expired order stock:", error);
        });
      }
    }, 60 * 1000);
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    console.warn("Starting server without database connection. Database-backed endpoints will be unavailable.");
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      if (mongoose.connection.readyState !== 1) {
        console.warn("MongoDB is not connected. Database-backed endpoints will be unavailable.");
      }
    });
  });
