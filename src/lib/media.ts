export const MAX_UPLOAD_MB = 5;
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/avif": "avif",
};

export function validateImage(type: string, size: number) {
  if (!Object.hasOwn(IMAGE_TYPES, type)) throw new Error("Unsupported image type. Use JPG, PNG, WEBP, GIF or AVIF.");
  if (!Number.isInteger(size) || size <= 0 || size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error(`Image must be nonempty and no larger than ${MAX_UPLOAD_MB} MB.`);
  }
}

export function publicImageUrl(base: string, key: string) {
  const url = new URL(base);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("R2_PUBLIC_BASE_URL must be a public HTTPS URL without credentials, query or fragment.");
  }
  return `${url.href.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function validateImageKey(key: string) {
  if (!/^(covers|inline)\/[a-f0-9-]{36}\.(jpg|png|webp|gif|avif)$/.test(key)) {
    throw new Error("Invalid image key.");
  }
}