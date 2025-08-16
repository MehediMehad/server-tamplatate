export const userSearchAbleFields: string[] = ["email"]; // only for search term
export const dashboardFilterableField = ["year"];
export const userFilterableFields: string[] = ["role", "status", "searchTerm"];

// Define allowed file types
// export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
export const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",
];

export const allowedVideoTypes = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
];

// Max sizes
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 1000 * 1024 * 1024; // 1000MB
