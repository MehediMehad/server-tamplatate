import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import httpStatus from "http-status";
import morgan from "morgan"; // 📋 HTTP request logger

import router from "./app/routes";
import globalErrorHandler from "./app/errors/globalErrorHandler";

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
    origin: process.env.CLIENT_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);

// // 📦 Body Parsers (handle large payloads)
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));

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

// ❤️ Health Check Endpoint
app.get("/", (_req: Request, res: Response) =>
  res.status(httpStatus.OK).json({ message: "🟢 Server is up and running." })
);

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
