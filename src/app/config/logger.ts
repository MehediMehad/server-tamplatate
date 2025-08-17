import winston from "winston";
import path from "path";

// Define log directory and file
const logDirectory = path.join(__dirname, "../../../logs");
const errorLogFile = path.join(logDirectory, "error.log");

// Create Winston logger
const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: errorLogFile,
      level: "error",
    }),
  ],
});

// Ensure log directory exists
import fs from "fs";
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

export default logger;
