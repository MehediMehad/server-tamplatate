import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReportsValidation } from "./report.validation";
import { ReportsController } from "./report.controller";

const router = express.Router();

router.post(
  "/",
  auth("GUEST", "HOST", "VENDOR", "SUPERADMIN"),
  validateRequest(ReportsValidation.createReportSchema),
  ReportsController.sendReport
);

router.get(
  "/host-property-service",
  auth("HOST"),
  ReportsController.getHostPropertyServiceReport
);

export const ReportRoutes = router;
