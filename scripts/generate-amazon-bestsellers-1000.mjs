import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INPUT_PATH = process.argv[2];
const OUTPUT_PATH =
  process.argv[3] ||
  path.resolve(process.cwd(), "src/data/amazon-bestsellers-1000-with-images.csv");

const DEFAULT_INVENTORY = 50;

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

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0] || "");

  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });

  return rows;
}

function csvEscape(value) {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}

function normalizeGenre(categoriesValue) {
  if (!categoriesValue) {
    return "Books";
  }

  try {
    const categories = JSON.parse(categoriesValue);
    const usefulCategory = categories.find(
      (value) =>
        typeof value === "string" &&
        value !== "Books" &&
        value !== "Literature & Fiction" &&
        value !== "Children's Books",
    );

    return usefulCategory || categories.at(-1) || "Books";
  } catch {
    return "Books";
  }
}

function normalizeFormat(formatValue) {
  if (!formatValue) {
    return "Hardcover";
  }

  try {
    const formats = JSON.parse(formatValue);
    const physicalPreference = [
      "Hardcover",
      "Paperback",
      "Mass Market Paperback",
      "Board book",
      "Spiral-bound",
      "Flexibound",
      "Library Binding",
    ];

    for (const preferred of physicalPreference) {
      const match = formats.find(
        (item) => item && typeof item.name === "string" && item.name === preferred,
      );

      if (match) {
        return match.name;
      }
    }

    const firstNamedFormat = formats.find(
      (item) => item && typeof item.name === "string" && item.name.trim(),
    );

    return firstNamedFormat?.name || "Hardcover";
  } catch {
    return "Hardcover";
  }
}

function normalizePrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed.toFixed(2) : "14.99";
}

function normalizeAuthor(value) {
  return String(value || "")
    .replace(/^by\s+/i, "")
    .replace(/\s*\((author|editor|illustrator)[^)]+\)\s*$/i, "")
    .replace(/\s*\((author|editor|illustrator)\)\s*$/i, "")
    .trim();
}

function normalizeDescription(value, title, genre) {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();
  const looksBroken =
    !trimmed ||
    trimmed.length < 40 ||
    trimmed.length > 420 ||
    trimmed.includes(".aplus-v2") ||
    trimmed.includes("Read more") ||
    trimmed.includes("From the Publisher") ||
    trimmed.includes("{") ||
    trimmed.includes("}");

  if (!looksBroken) {
    return trimmed;
  }

  return `${title} is a highly reviewed Amazon bestselling ${genre.toLowerCase()} title included in this import set.`;
}

async function main() {
  if (!INPUT_PATH) {
    throw new Error("Usage: node scripts/generate-amazon-bestsellers-1000.mjs <input-csv> [output-csv]");
  }

  const content = await readFile(INPUT_PATH, "utf8");
  const rows = parseCsv(content);
  const seenIsbns = new Set();
  const seenTitles = new Set();

  const selected = rows
    .filter((row) => {
      const isbn = row.ISBN10?.trim();
      const title = row.title?.trim();
      const author = normalizeAuthor(row.brand);
      const imageUrl = row.image_url?.trim();
      const price = Number(row.final_price);
      const reviewsCount = Number(row.reviews_count);
      const titleKey = `${title || ""}::${author || ""}`.toLowerCase();

      if (!isbn || !title || !author || !imageUrl) {
        return false;
      }

      if (!Number.isFinite(price) || price <= 0) {
        return false;
      }

      if (!Number.isFinite(reviewsCount) || reviewsCount < 10000) {
        return false;
      }

      if (seenIsbns.has(isbn) || seenTitles.has(titleKey)) {
        return false;
      }

      seenIsbns.add(isbn);
      seenTitles.add(titleKey);
      return true;
    })
    .sort((left, right) => Number(right.reviews_count) - Number(left.reviews_count))
    .slice(0, 1000)
    .map((row) => {
      const genre = normalizeGenre(row.categories);

      return {
        slug: `${slugify(row.title)}-${slugify(row.ISBN10)}`,
        title: row.title.trim(),
        author: normalizeAuthor(row.brand),
        isbn: row.ISBN10.trim(),
        price: normalizePrice(row.final_price),
        inventory: String(DEFAULT_INVENTORY),
        genre,
        format: normalizeFormat(row.format),
        description: normalizeDescription(row.description, row.title.trim(), genre),
        image_url: row.image_url.trim(),
      };
    });

  if (selected.length < 1000) {
    throw new Error(`Only found ${selected.length} valid rows. Expected 1000.`);
  }

  const headers = [
    "slug",
    "title",
    "author",
    "isbn",
    "price",
    "inventory",
    "genre",
    "format",
    "description",
    "image_url",
  ];
  const lines = [
    headers.join(","),
    ...selected.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(","),
    ),
  ];

  await writeFile(OUTPUT_PATH, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${selected.length} rows to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Failed to generate 1000-book CSV.", error);
  process.exitCode = 1;
});
