const UPLOAD_SEGMENT = "/image/upload/";

// Serves a Cloudinary image in the best format/quality the browser supports,
// capped at `width` px (never upscaled). Non-Cloudinary URLs pass through.
export function optimizeImage(src, width) {
  if (!src || !src.includes("res.cloudinary.com") || !src.includes(UPLOAD_SEGMENT)) {
    return src;
  }
  const transform = ["f_auto", "q_auto", width && `c_limit,w_${width}`]
    .filter(Boolean)
    .join(",");
  return src.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transform}/`);
}
