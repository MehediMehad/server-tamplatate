import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import httpStatus from "http-status";
import morgan from "morgan"; // 📋 HTTP request logger

import router from "./app/routes";
import globalErrorHandler from "./app/errors/globalErrorHandler";
import path from "path/win32";

const app: Application = express();

// 📊 HTTP Logging (Morgan)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // 🛠️ Development-friendly logging
} else {
  app.use(morgan("combined")); // 📁 Production-style logs
}

// 🌐 CORS Configuration (support multiple origins)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || [
      "http://192.168.0.103:5030",
      "http://localhost:5030",
    ],
    credentials: true,
  })
);

// 📦 Body parser – apply only when NOT multipart/form-data
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    express.json({ limit: "10mb" })(req, res, () => {
      express.urlencoded({ extended: true })(req, res, next);
    });
  } else {
    next(); // skip body parser for file upload
  }
});

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../../"));

// Serve static files from the project root
app.use(express.static(path.join(__dirname, "../../")));

// Health Check Endpoint
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../health.html"));
});

app.get("/error", (req: Request, res: Response) => {
  throw new Error("This is a forced error!");
});

// 📡 API Routes
app.use("/api/v1", router);

// 🧯 Global Error Handler
app.use(globalErrorHandler);

// 🚫 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "The requested endpoint does not exist.",
    },
  });
});

export default app;
