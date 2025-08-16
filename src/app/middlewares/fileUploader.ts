import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique filenames

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: async function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`; // Add unique suffix
    const extension = path.extname(file.originalname);
    const filename = `${path.basename(
      file.originalname,
      extension
    )}-${uniqueSuffix}${extension}`;
    cb(null, filename); // Use unique filename
  },
});

const upload = multer({ storage: storage });

// Upload single image
const uploadImage = upload.single("uploadImage");
const uploadBannerImage = upload.single("image");
const uploadMultiple = upload.array("images");

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "file", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "license", maxCount: 1 },
  { name: "musicalCertification", maxCount: 1 },
  { name: "instrumentsImage", maxCount: 1 },
  { name: "registrationCertificate", maxCount: 1 },
  { name: "verificationDocument", maxCount: 1 },
  { name: "exemptionCertificate", maxCount: 1 },
]);

export const fileUploader = {
  upload,
  uploadImage,
  uploadBannerImage,
  uploadMultiple,
  uploadFields,
};
