import { createHash } from "node:crypto";

type CloudinaryCredentials = {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
};

type CloudinaryUploadSource = File | string;

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
};

const CLOUDINARY_FOLDER = "noordons-books";

function getCloudinaryCredentials(): CloudinaryCredentials | null {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

  if (!cloudinaryUrl) {
    return null;
  }

  const parsed = new URL(cloudinaryUrl);
  const parsedCloudName = decodeURIComponent(parsed.hostname);
  const publicCloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || parsedCloudName;

  if (!parsed.username || !parsed.password || !parsedCloudName) {
    throw new Error("CLOUDINARY_URL is incomplete.");
  }

  if (publicCloudName !== parsedCloudName) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME must match the cloud name in CLOUDINARY_URL.",
    );
  }

  return {
    apiKey: decodeURIComponent(parsed.username),
    apiSecret: decodeURIComponent(parsed.password),
    cloudName: publicCloudName,
  };
}

export const isCloudinaryConfigured = Boolean(process.env.CLOUDINARY_URL);

function signUploadParams(
  params: Record<string, string | number>,
  apiSecret: string,
) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function uploadImageToCloudinary(
  source: CloudinaryUploadSource,
): Promise<CloudinaryUploadResult> {
  const credentials = getCloudinaryCredentials();

  if (!credentials) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: CLOUDINARY_FOLDER,
    timestamp,
  };
  const signature = signUploadParams(params, credentials.apiSecret);
  const formData = new FormData();

  formData.set("api_key", credentials.apiKey);
  formData.set("folder", CLOUDINARY_FOLDER);
  formData.set("timestamp", String(timestamp));
  formData.set("signature", signature);

  if (typeof source === "string") {
    formData.set("file", source);
  } else {
    formData.set("file", source, source.name || "book-cover");
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
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
    throw new Error(payload.error?.message || "Cloudinary upload failed.");
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}
