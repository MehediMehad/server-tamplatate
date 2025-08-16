import fs from "fs";
import path from "path";

export function removeAllFilesInUploadsFolder() {
  const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads");

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });

    console.log("🗑️ All files in uploads folder deleted successfully.");
  } else {
    console.log("⚠️ uploads folder does not exist.");
  }
}
