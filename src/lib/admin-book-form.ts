import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary";
import type { CreateBookInput } from "@/types/book";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseRequiredNumber(
  formData: FormData,
  key: string,
  label: string,
  options: {
    integer?: boolean;
    min?: number;
  } = {},
) {
  const rawValue = readString(formData, key);
  const value = Number(rawValue);

  if (!rawValue || !Number.isFinite(value)) {
    throw new Error(`${label} is required.`);
  }

  if (options.integer && !Number.isInteger(value)) {
    throw new Error(`${label} must be a whole number.`);
  }

  if (options.min !== undefined && value < options.min) {
    throw new Error(`${label} must be at least ${options.min}.`);
  }

  return value;
}

function parseOptionalNumber(formData: FormData, key: string, label: string) {
  const rawValue = readString(formData, key);

  if (!rawValue) {
    return undefined;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid positive number.`);
  }

  return value;
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePalette(formData: FormData): [string, string] {
  const start = readString(formData, "paletteStart");
  const end = readString(formData, "paletteEnd");

  return [
    HEX_COLOR_PATTERN.test(start) ? start : "#60453b",
    HEX_COLOR_PATTERN.test(end) ? end : "#deaf91",
  ];
}

async function resolveImageUrl(
  formData: FormData,
  options: {
    existingImageUrl?: string;
  } = {},
) {
  const uploadedFile = formData.get("imageFile");

  if (uploadedFile instanceof File && uploadedFile.size > 0) {
    if (!uploadedFile.type.startsWith("image/")) {
      throw new Error("Cover upload must be an image file.");
    }

    if (uploadedFile.size > MAX_IMAGE_BYTES) {
      throw new Error("Cover upload must be smaller than 2 MB.");
    }

    if (!isCloudinaryConfigured) {
      throw new Error("Cloudinary is not configured for image uploads.");
    }

    const result = await uploadImageToCloudinary(uploadedFile);
    return result.secureUrl;
  }

  const imageUrl = readString(formData, "imageUrl");

  if (!imageUrl) {
    return options.existingImageUrl;
  }

  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured for image uploads.");
  }

  const result = await uploadImageToCloudinary(imageUrl);
  return result.secureUrl;
}

export async function parseAdminBookInput(
  formData: FormData,
  options: {
    existingImageUrl?: string;
  } = {},
): Promise<CreateBookInput> {
  const price = parseRequiredNumber(formData, "price", "Price", { min: 0 });
  const compareAtPrice = parseOptionalNumber(
    formData,
    "compareAtPrice",
    "Compare at price",
  );

  if (compareAtPrice !== undefined && compareAtPrice < price) {
    throw new Error("Compare at price must be greater than or equal to price.");
  }

  return {
    title: readString(formData, "title"),
    slug: readString(formData, "slug") || undefined,
    author: readString(formData, "author"),
    genre: readString(formData, "genre"),
    format: readString(formData, "format"),
    language: readString(formData, "language"),
    imageUrl: await resolveImageUrl(formData, options),
    price,
    compareAtPrice,
    featured: formData.has("featured"),
    badge: readString(formData, "badge") || undefined,
    inventory: parseRequiredNumber(formData, "inventory", "Inventory", {
      integer: true,
      min: 0,
    }),
    pages: parseRequiredNumber(formData, "pages", "Pages", {
      integer: true,
      min: 1,
    }),
    publishedYear: parseRequiredNumber(
      formData,
      "publishedYear",
      "Published year",
      {
        integer: true,
        min: 1000,
      },
    ),
    isbn: readString(formData, "isbn"),
    palette: normalizePalette(formData),
    description: readString(formData, "description"),
    longDescription: splitLineList(readString(formData, "longDescription")),
    highlights: splitCommaList(readString(formData, "highlights")),
    tags: splitCommaList(readString(formData, "tags")),
  };
}
