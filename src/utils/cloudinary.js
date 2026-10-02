const IMAGE_SEGMENT = "/image/upload/";
const VIDEO_SEGMENT = "/video/upload/";

function isCloudinary(src, segment) {
  return Boolean(src) && src.includes("res.cloudinary.com") && src.includes(segment);
}

function withExtension(src, ext) {
  return src.replace(/\.[a-z0-9]+(?=$|\?)/i, `.${ext}`);
}

// Cloudinary applies each slash-separated component in order; one action per component.
function transformUrl(src, segment, components) {
  return src.replace(segment, `${segment}${components.filter(Boolean).join("/")}/`);
}

// Serves a Cloudinary image in the best format/quality the browser supports,
// capped at `width` px (never upscaled). Non-Cloudinary URLs pass through.
// Keep these strings stable — a new transform URL is a new (paid) derivative.
export function optimizeImage(src, width) {
  if (!isCloudinary(src, IMAGE_SEGMENT)) return src;
  // f_auto/q_auto on a GIF often freezes it to the first frame.
  if (/\.gif(?:$|\?)/i.test(src)) return src;
  return transformUrl(src, IMAGE_SEGMENT, [
    width && `c_limit,w_${width}`,
    "f_auto",
    "q_auto",
  ]);
}

// Compressed H.264 MP4, optionally trimmed to the first `duration` seconds.
// H.264 output makes Cloudinary tone-map HDR sources (e.g. iPhone clips) to SDR.
export function optimizeVideo(src, { width, duration } = {}) {
  if (!isCloudinary(src, VIDEO_SEGMENT)) return src;
  const url = transformUrl(src, VIDEO_SEGMENT, [
    duration && `du_${duration}`,
    width && `c_limit,w_${width}`,
    "q_auto",
    "vc_h264",
  ]);
  return withExtension(url, "mp4");
}

// First frame of a Cloudinary video as an image, for use as a <video> poster.
export function videoPoster(src, width) {
  if (!isCloudinary(src, VIDEO_SEGMENT)) return undefined;
  const url = transformUrl(src, VIDEO_SEGMENT, [
    "so_0",
    width && `c_limit,w_${width}`,
    "f_auto",
    "q_auto",
  ]);
  return withExtension(url, "jpg");
}
