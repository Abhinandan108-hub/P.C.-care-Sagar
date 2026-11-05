import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  exportSalesCsv,
  exportSalesPdf,
  exportServiceCsv,
  exportServicePdf,
  getLowStockProducts,
  getMonthlySales,
  getOverview,
  getAuditLogs,
  getSalesReport,
  getServiceReport,
  getTopSellingProducts,
} from "../controllers/analyticsController";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));
router.get("/overview", getOverview);
router.get("/audit-logs", getAuditLogs);
router.get("/sales/monthly", getMonthlySales);
router.get("/products/top-selling", getTopSellingProducts);
router.get("/products/low-stock", getLowStockProducts);
router.get("/reports/sales", getSalesReport);
router.get("/reports/services", getServiceReport);
router.get("/reports/sales.csv", exportSalesCsv);
router.get("/reports/sales.pdf", exportSalesPdf);
router.get("/reports/services.csv", exportServiceCsv);
router.get("/reports/services.pdf", exportServicePdf);

export default router;
