import crypto from "node:crypto";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
};

function normalizeCredential(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("<") && trimmed.endsWith(">")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getCloudinaryConfig(): CloudinaryConfig {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    throw new Error("Missing CLOUDINARY_URL in environment variables.");
  }

  const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) {
    throw new Error("Invalid CLOUDINARY_URL format.");
  }

  const apiKey = match[1];
  const apiSecret = match[2];
  const cloudName = match[3];

  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("Incomplete CLOUDINARY_URL credentials.");
  }

  return {
    cloudName: decodeURIComponent(normalizeCredential(cloudName)),
    apiKey: decodeURIComponent(normalizeCredential(apiKey)),
    apiSecret: decodeURIComponent(normalizeCredential(apiSecret)),
  };
}

function createSignature(
  params: Record<string, string | number | boolean | null | undefined>,
  apiSecret: string,
) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export async function uploadImageToCloudinary(
  file: File,
  folder = "royal-king-water-supply/fuel-bills",
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createSignature({ folder, timestamp }, apiSecret);

  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);
  formData.set("timestamp", `${timestamp}`);
  formData.set("api_key", apiKey);
  formData.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(payload.error?.message ?? "Failed to upload image to Cloudinary.");
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}

export async function deleteImageFromCloudinary(publicId?: string | null) {
  if (!publicId) return;

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const invalidate = true;
  const signature = createSignature({ invalidate, public_id: publicId, timestamp }, apiSecret);

  const formData = new FormData();
  formData.set("public_id", publicId);
  formData.set("timestamp", `${timestamp}`);
  formData.set("invalidate", "true");
  formData.set("api_key", apiKey);
  formData.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message ?? "Failed to delete image from Cloudinary.");
  }
}
