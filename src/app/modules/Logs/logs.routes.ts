import express from "express";
import { LogsController } from "./logs.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/errors", LogsController.getErrorLogs);
router.get("/html", auth("SUPERADMIN"), LogsController.renderErrorLogs);

export const LogsRoutes = router;
