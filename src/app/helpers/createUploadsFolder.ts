import fs from "fs";
import path from "path";

export function createUploadsFolder() {
  const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 uploads folder created successfully!");
  } else {
    console.log("📁 uploads folder already exists.");
  }
}
