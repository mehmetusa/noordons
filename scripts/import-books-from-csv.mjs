import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import mongoose from "mongoose";

const ROOT_DIRECTORY = process.cwd();
const DATA_DIRECTORY = path.resolve(process.cwd(), "src/data");
const DEFAULT_PALETTE = ["#60453b", "#deaf91"];
const DEFAULT_PAGES = 320;
const DEFAULT_YEAR = new Date().getFullYear();

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    author: { type: String, required: true, trim: true },
    genre: { type: String, required: true, trim: true },
    format: { type: String, required: true, trim: true },
    language: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewCount: { type: Number, required: true, min: 0 },
    featured: { type: Boolean, default: false },
    badge: { type: String, trim: true },
    inventory: { type: Number, required: true, min: 0 },
    pages: { type: Number, required: true, min: 1 },
    publishedYear: { type: Number, required: true },
    isbn: { type: String, required: true, trim: true },
    palette: { type: [String], required: true },
    description: { type: String, required: true, trim: true },
    longDescription: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    tags: { type: [String], default: [] },
  },
  {
    versionKey: false,
  },
);

const BookModel =
  mongoose.models.Book || mongoose.model("Book", bookSchema, "books");

async function loadEnvFile(filename) {
  const absolutePath = path.join(ROOT_DIRECTORY, filename);

  try {
    const content = await readFile(absolutePath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];

      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });

  return { headers, rows };
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function toList(value, fallback = []) {
  if (!value) {
    return fallback;
  }

  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapRowToBook(row) {
  const title = row.title?.trim();
  const description = row.description?.trim() || "Imported from CSV.";
  const genre = row.genre?.trim() || "General";
  const format = row.format?.trim() || "Hardcover";
  const imageUrl = row.image_url?.trim() || row.imageUrl?.trim() || undefined;
  const isbn = row.isbn?.trim() || slugify(title);

  if (!title || !row.author?.trim()) {
    throw new Error(`Missing title or author for ISBN ${isbn || "unknown"}.`);
  }

  return {
    title,
    slug: slugify(row.slug?.trim() || title),
    author: row.author.trim(),
    genre,
    format,
    language: row.language?.trim() || "English",
    imageUrl,
    price: toNumber(row.price, 0),
    compareAtPrice: row.compareAtPrice
      ? toNumber(row.compareAtPrice, undefined)
      : undefined,
    rating: toNumber(row.rating, 0),
    reviewCount: toNumber(row.reviewCount, 0),
    featured: toBoolean(row.featured, false),
    badge: row.badge?.trim() || "Bestseller",
    inventory: toNumber(row.inventory, 0),
    pages: toNumber(row.pages, DEFAULT_PAGES),
    publishedYear: toNumber(
      row.published_year || row.publishedYear,
      DEFAULT_YEAR,
    ),
    isbn,
    palette: [
      row.palette_start?.trim() || DEFAULT_PALETTE[0],
      row.palette_end?.trim() || DEFAULT_PALETTE[1],
    ],
    description,
    longDescription: toList(row.long_description, [description]),
    highlights: toList(row.highlights, [`Imported ${format} bestseller`]),
    tags: toList(row.tags, [genre, "Bestseller"]),
  };
}

async function findImportableCsvFiles() {
  const entries = await readdir(DATA_DIRECTORY, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".csv")) {
      continue;
    }

    const absolutePath = path.join(DATA_DIRECTORY, entry.name);
    const content = await readFile(absolutePath, "utf8");
    const { headers } = parseCsv(content);

    if (headers.includes("image_url")) {
      matches.push({ absolutePath, content });
    }
  }

  return matches;
}

async function loadRequestedCsvFiles(requestedFiles) {
  const matches = [];

  for (const requestedFile of requestedFiles) {
    const absolutePath = path.isAbsolute(requestedFile)
      ? requestedFile
      : path.resolve(ROOT_DIRECTORY, requestedFile);
    const content = await readFile(absolutePath, "utf8");
    const { headers } = parseCsv(content);

    if (!headers.includes("image_url")) {
      throw new Error(
        `${path.basename(absolutePath)} does not include an image_url column.`,
      );
    }

    matches.push({ absolutePath, content });
  }

  return matches;
}

async function main() {
  await loadEnvFile(".env");
  await loadEnvFile(".env.local");

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const requestedFiles = process.argv.slice(2);
  const csvFiles = requestedFiles.length
    ? await loadRequestedCsvFiles(requestedFiles)
    : await findImportableCsvFiles();

  if (!csvFiles.length) {
    console.log("No CSV files with image_url headers were found in src/data.");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
  });

  let totalProcessed = 0;

  for (const file of csvFiles) {
    const { rows } = parseCsv(file.content);
    const operations = rows.map((row) => {
      const payload = mapRowToBook(row);

      return {
        updateOne: {
          filter: payload.isbn ? { isbn: payload.isbn } : { slug: payload.slug },
          update: { $set: payload },
          upsert: true,
        },
      };
    });

    if (!operations.length) {
      continue;
    }

    const result = await BookModel.bulkWrite(operations, { ordered: false });

    totalProcessed += operations.length;
    console.log(
      `Imported ${operations.length} rows from ${path.basename(file.absolutePath)}.`,
    );
    console.log(
      `Upserted: ${result.upsertedCount || 0}, modified: ${result.modifiedCount || 0}, matched: ${result.matchedCount || 0}.`,
    );
  }

  console.log(
    `Finished processing ${totalProcessed} rows across ${csvFiles.length} CSV file(s).`,
  );
}

main()
  .catch((error) => {
    console.error("CSV import failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
