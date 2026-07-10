// Cloudinary URL helpers — insert on-the-fly transformations so lists and
// previews don't download the full-resolution original image.

export function cloudinaryThumb(url: string, width = 320): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/w_${width},c_limit,q_auto,f_auto/`);
}

export function cloudinaryAuto(url: string): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/q_auto,f_auto/");
}
