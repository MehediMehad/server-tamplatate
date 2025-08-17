import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import httpStatus from "http-status";
import morgan from "morgan";
import path from "path";

import router from "./app/routes";
import globalErrorHandler from "./app/errors/globalErrorHandler";

const app: Application = express();

// 📊 HTTP Logging (Morgan)
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// 🌐 CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || [
      "http://192.168.0.103:5030",
      "http://localhost:5030",
    ],
    credentials: true,
  })
);

// 📦 Body Parser – skip for multipart/form-data
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, () => {
    express.urlencoded({ extended: true })(req, res, next);
  });
});

// 📂 Static Files
app.use(express.static(path.join(__dirname, "../public")));

// 🌍 Server Running Page
app.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Server Status • Online</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f1b3a 0%, #1a2b5c 50%, #3a1c71 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #e0f7fa;
            overflow: hidden;
            position: relative;
          }

          /* Animated background dots */
          body::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-image: 
              radial-gradient(circle at 20% 30%, rgba(30, 144, 255, 0.1) 0%, transparent 20%),
              radial-gradient(circle at 80% 70%, rgba(138, 43, 226, 0.1) 0%, transparent 20%);
            pointer-events: none;
            z-index: 0;
          }

          .card {
            position: relative;
            z-index: 1;
            background: rgba(25, 35, 65, 0.4);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 50px 60px;
            border-radius: 24px;
            text-align: center;
            max-width: 480px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            transform: translateY(0);
            animation: float 6s ease-in-out infinite, fadeInUp 1s ease;
          }

          .icon {
            font-size: 4rem;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
          }

          .card h1 {
            font-size: 2.4rem;
            font-weight: 700;
            background: linear-gradient(90deg, #00c6ff, #0072ff, #b14aff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
          }

          .status {
            display: inline-block;
            padding: 10px 24px;
            border-radius: 50px;
            background: rgba(0, 200, 100, 0.2);
            color: #00ff9d;
            font-weight: 600;
            font-size: 1.1rem;
            letter-spacing: 0.5px;
            box-shadow: 0 0 15px rgba(0, 255, 127, 0.3);
            animation: pulse 2s infinite;
            margin: 20px 0;
          }

          .desc {
            font-size: 1.05rem;
            color: #a0d8f1;
            margin: 25px 0;
            line-height: 1.6;
            opacity: 0.9;
          }

          .btn {
            display: inline-block;
            padding: 14px 32px;
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            background: linear-gradient(45deg, #00c6ff, #0072ff);
            border-radius: 30px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 114, 255, 0.4);
            margin-top: 10px;
          }

          .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 114, 255, 0.6);
            background: linear-gradient(45deg, #00b0f0, #0060cc);
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }

          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          @keyframes pulse {
            0% {
              box-shadow: 0 0 10px rgba(0, 255, 127, 0.4);
            }
            50% {
              box-shadow: 0 0 25px rgba(0, 255, 127, 0.8);
            }
            100% {
              box-shadow: 0 0 10px rgba(0, 255, 127, 0.4);
            }
          }

          @media (max-width: 500px) {
            .card {
              padding: 40px 30px;
            }
            .card h1 {
              font-size: 2rem;
            }
            .icon { font-size: 3rem; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🚀</div>
          <h1>Server Online</h1>
          <div class="status">🟢 Operational & Healthy</div>
          <p class="desc">
            The API server is up and running smoothly. No issues detected.
          </p>
          <a href="/api/v1/logs/html" class="btn">View Logs</a>
        </div>
      </body>
    </html>
  `);
});

// 🚨 Forced Error Route
app.get("/error", () => {
  throw new Error("This is a forced error!");
});

// 📡 API Routes
app.use("/api/v1", router);

// 🧯 Global Error Handler
app.use(globalErrorHandler);

// 🚫 404 Not Found
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
