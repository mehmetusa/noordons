import { sampleBooks } from "@/data/sample-books";
import { dbConnect, isMongoConfigured } from "@/lib/mongodb";
import { BookModel, type BookDocument } from "@/models/Book";
import type { Book, BookFilters, CreateBookInput } from "@/types/book";

const MONGODB_BOOKS_COLLECTION =
  process.env.MONGODB_BOOKS_COLLECTION?.trim() || "books";
const DEFAULT_IMPORTED_PRICE = 19.99;
const DEFAULT_IMPORTED_INVENTORY = 4;
const DEFAULT_IMPORTED_PAGES = 320;
const DEFAULT_IMPORTED_YEAR = new Date().getFullYear();

export const mongoBooksCollectionName = MONGODB_BOOKS_COLLECTION;
export const isMongoCatalogReadOnly = MONGODB_BOOKS_COLLECTION !== "books";

export type CatalogStats = {
  titleCount: number;
  genreCount: number;
};

type AtlasProductDocument = {
  _id?: unknown;
  title?: string;
  brand?: string;
  imageUrl?: string;
  isbn?: string;
  isbn13?: string;
  asin?: string;
  targetCategoryName?: string;
  targetSellPrice?: number;
  sourceBuyPrice?: number;
  targetMarket?: string;
  sourceMarket?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  marketStats?: {
    rating?: number;
    reviewCount?: number;
  };
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBook(document: BookDocument & { _id?: unknown }): Book {
  const palette =
    Array.isArray(document.palette) && document.palette.length >= 2
      ? [document.palette[0], document.palette[1]]
      : ["#60453b", "#deaf91"];

  return {
    title: document.title,
    slug: document.slug,
    author: document.author,
    genre: document.genre,
    format: document.format,
    language: document.language,
    imageUrl: document.imageUrl ?? undefined,
    price: document.price,
    compareAtPrice: document.compareAtPrice ?? undefined,
    rating: document.rating,
    reviewCount: document.reviewCount,
    featured: document.featured,
    badge: document.badge ?? undefined,
    inventory: document.inventory,
    pages: document.pages,
    publishedYear: document.publishedYear,
    isbn: document.isbn,
    palette: palette as [string, string],
    description: document.description,
    longDescription: document.longDescription ?? [],
    highlights: document.highlights ?? [],
    tags: document.tags ?? [],
  };
}

function normalizeTextList(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function buildBookPayload(input: CreateBookInput, slug: string) {
  return {
    title: input.title.trim(),
    slug,
    author: input.author.trim(),
    genre: input.genre.trim(),
    format: input.format.trim(),
    language: input.language.trim(),
    imageUrl: input.imageUrl?.trim() || undefined,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    featured: Boolean(input.featured),
    badge: input.badge?.trim() || undefined,
    inventory: input.inventory,
    pages: input.pages,
    publishedYear: input.publishedYear,
    isbn: input.isbn.trim(),
    palette: input.palette ?? ["#60453b", "#deaf91"],
    description: input.description.trim(),
    longDescription: normalizeTextList(input.longDescription),
    highlights: normalizeTextList(input.highlights),
    tags: normalizeTextList(input.tags),
  };
}

function sortBooks(books: Book[]) {
  return [...books].sort((left, right) => {
    return (
      Number(right.featured) - Number(left.featured) ||
      right.reviewCount - left.reviewCount ||
      right.publishedYear - left.publishedYear ||
      left.title.localeCompare(right.title)
    );
  });
}

function filterLocalBooks(books: Book[], filters: BookFilters) {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  const filtered = books.filter((book) => {
    if (filters.genre && filters.genre !== "All" && book.genre !== filters.genre) {
      return false;
    }

    if (filters.featured && !book.featured) {
      return false;
    }

    if (filters.excludeSlug && book.slug === filters.excludeSlug) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      book.title,
      book.author,
      book.genre,
      book.format,
      ...book.tags,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const sorted = sortBooks(filtered);

  if (!filters.limit) {
    return sorted;
  }

  return sorted.slice(0, filters.limit);
}

function usesAtlasProductsCollection() {
  return MONGODB_BOOKS_COLLECTION === "products";
}

function extractExternalIdentifier(document: AtlasProductDocument) {
  return (
    document.isbn?.trim() ||
    document.isbn13?.trim() ||
    document.asin?.trim() ||
    String(document._id ?? "")
  );
}

function buildExternalSlug(document: AtlasProductDocument) {
  const identifier = extractExternalIdentifier(document);
  const titleSeed = document.title?.trim() || identifier || "untitled-book";
  return `${slugify(titleSeed)}--${slugify(identifier)}`;
}

function readImportedYear(document: AtlasProductDocument) {
  for (const value of [document.updatedAt, document.createdAt]) {
    if (!value) {
      continue;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.getFullYear();
    }
  }

  return DEFAULT_IMPORTED_YEAR;
}

function readImportedFormat(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("hardcover") || normalizedTitle.includes("hardback")) {
    return "Hardcover";
  }

  if (normalizedTitle.includes("paperback") || normalizedTitle.includes("softcover")) {
    return "Paperback";
  }

  if (normalizedTitle.includes("board book")) {
    return "Board Book";
  }

  if (normalizedTitle.includes("spiral")) {
    return "Spiral-bound";
  }

  if (normalizedTitle.includes("kindle") || normalizedTitle.includes("ebook")) {
    return "eBook";
  }

  return "Paperback";
}

function readImportedPrice(document: AtlasProductDocument) {
  if (
    typeof document.targetSellPrice === "number" &&
    Number.isFinite(document.targetSellPrice) &&
    document.targetSellPrice > 0
  ) {
    return Math.round(document.targetSellPrice * 100) / 100;
  }

  if (
    typeof document.sourceBuyPrice === "number" &&
    Number.isFinite(document.sourceBuyPrice) &&
    document.sourceBuyPrice > 0
  ) {
    return Math.round(Math.max(document.sourceBuyPrice * 2, 7.99) * 100) / 100;
  }

  return DEFAULT_IMPORTED_PRICE;
}

function readImportedRating(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (value > 5) {
    return Math.max(0, Math.min(5, value / 10));
  }

  return Math.max(0, Math.min(5, value));
}

function readImportedReviewCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  // Some upstream records carry obviously inflated review totals.
  if (value > 500_000) {
    return 0;
  }

  return Math.round(value);
}

function normalizeAtlasProduct(document: AtlasProductDocument): Book {
  const identifier = extractExternalIdentifier(document);
  const title = document.title?.trim() || `ISBN ${identifier}`;
  const genre = document.targetCategoryName?.trim() || "Books";
  const reviewCount = readImportedReviewCount(document.marketStats?.reviewCount);
  const rating = readImportedRating(document.marketStats?.rating);
  const price = readImportedPrice(document);
  const format = readImportedFormat(title);
  const imageUrl = document.imageUrl?.trim() || undefined;
  const isbn = document.isbn?.trim() || document.isbn13?.trim() || identifier;
  const author = document.brand?.trim() || "Unknown author";
  const featured = Boolean(imageUrl && (reviewCount >= 25 || rating >= 4.5));

  return {
    title,
    slug: buildExternalSlug(document),
    author,
    genre,
    format,
    language: "English",
    imageUrl,
    price,
    compareAtPrice: undefined,
    rating,
    reviewCount,
    featured,
    badge: featured ? "Imported" : undefined,
    inventory: DEFAULT_IMPORTED_INVENTORY,
    pages: DEFAULT_IMPORTED_PAGES,
    publishedYear: readImportedYear(document),
    isbn,
    palette: ["#60453b", "#deaf91"],
    description: `${title} is currently listed in the ${genre.toLowerCase()} shelf with imported catalog data and live ISBN mapping.`,
    longDescription: [
      `${title} is part of the connected Noordons catalog and is already live for browsing, pricing, and ISBN-based lookup.`,
      "Some extended metadata for this title may still be filling in from the connected source feed, but the storefront record is ready to browse and purchase.",
    ],
    highlights: [
      "Imported from connected catalog",
      `ISBN ${isbn}`,
      imageUrl ? "Cover image available" : "Cover image pending",
    ],
    tags: [genre, document.targetMarket, document.sourceMarket].filter(
      (value): value is string => Boolean(value?.trim()),
    ),
  };
}

function buildAtlasProductsFilter(filters: BookFilters) {
  const query: Record<string, unknown> = {
    isbn: { $type: "string", $ne: "" },
  };

  if (filters.genre && filters.genre !== "All") {
    query.targetCategoryName = filters.genre;
  }

  if (filters.featured) {
    query.imageUrl = { $type: "string", $ne: "" };
    query["marketStats.reviewCount"] = { $gte: 25 };
  }

  if (filters.query) {
    const regex = new RegExp(escapeRegExp(filters.query), "i");
    query.$or = [
      { title: regex },
      { brand: regex },
      { targetCategoryName: regex },
      { isbn: regex },
      { isbn13: regex },
    ];
  }

  return query;
}

async function readAtlasProductDocuments(
  filters: BookFilters,
  options?: { sortByTitle?: boolean; limit?: number },
) {
  const connection = await dbConnect();
  const db = connection?.connection.db;

  if (!db) {
    return null;
  }

  const collection = db.collection(MONGODB_BOOKS_COLLECTION);
  const limit =
    options?.limit ?? (filters.limit ? filters.limit + (filters.excludeSlug ? 1 : 0) : 0);

  let cursor = collection.find(buildAtlasProductsFilter(filters), {
    projection: {
      title: 1,
      brand: 1,
      imageUrl: 1,
      isbn: 1,
      isbn13: 1,
      asin: 1,
      targetCategoryName: 1,
      targetSellPrice: 1,
      sourceBuyPrice: 1,
      targetMarket: 1,
      sourceMarket: 1,
      createdAt: 1,
      updatedAt: 1,
      marketStats: 1,
    },
  });

  cursor = options?.sortByTitle
    ? cursor.sort({ title: 1 })
    : cursor.sort({
        "marketStats.reviewCount": -1,
        "marketStats.rating": -1,
        title: 1,
      });

  if (limit > 0) {
    cursor = cursor.limit(limit);
  }

  const documents = await cursor.toArray();
  return documents as AtlasProductDocument[];
}

async function readBooksFromMongo(filters: BookFilters) {
  if (!isMongoConfigured) {
    return null;
  }

  try {
    if (usesAtlasProductsCollection()) {
      const documents = await readAtlasProductDocuments(filters);
      if (!documents) {
        return null;
      }

      const books = sortBooks(
        documents.map((document) => normalizeAtlasProduct(document)),
      );
      const filteredBooks = filters.excludeSlug
        ? books.filter((book) => book.slug !== filters.excludeSlug)
        : books;

      if (!filteredBooks.length) {
        return null;
      }

      return filters.limit ? filteredBooks.slice(0, filters.limit) : filteredBooks;
    }

    await dbConnect();

    const total = await BookModel.estimatedDocumentCount();
    if (total === 0) {
      return null;
    }

    const query: Record<string, unknown> = {};

    if (filters.genre && filters.genre !== "All") {
      query.genre = filters.genre;
    }

    if (filters.featured) {
      query.featured = true;
    }

    if (filters.excludeSlug) {
      query.slug = { $ne: filters.excludeSlug };
    }

    if (filters.query) {
      const regex = new RegExp(escapeRegExp(filters.query), "i");
      query.$or = [
        { title: regex },
        { author: regex },
        { genre: regex },
        { format: regex },
        { tags: regex },
      ];
    }

    const cursor = BookModel.find(query).sort({
      featured: -1,
      reviewCount: -1,
      publishedYear: -1,
    });

    if (filters.limit) {
      cursor.limit(filters.limit);
    }

    const books = await cursor.lean();
    return books.map((book) => normalizeBook(book as BookDocument));
  } catch (error) {
    console.error("Failed to read books from MongoDB.", error);
    return null;
  }
}

function parseExternalIdentifierFromSlug(slug: string) {
  const [, identifier] = slug.split("--");
  return identifier?.trim() ? identifier.trim().toLowerCase() : null;
}

async function readBookFromMongo(slug: string) {
  if (!isMongoConfigured) {
    return null;
  }

  try {
    if (usesAtlasProductsCollection()) {
      const connection = await dbConnect();
      const db = connection?.connection.db;
      const identifier = parseExternalIdentifierFromSlug(slug);

      if (!db || !identifier) {
        return null;
      }

      const document = (await db.collection(MONGODB_BOOKS_COLLECTION).findOne(
        {
          isbn: { $type: "string", $ne: "" },
          $or: [
            { isbn: identifier },
            { isbn13: identifier },
            { asin: identifier.toUpperCase() },
            { asin: identifier },
          ],
        },
        {
          projection: {
            title: 1,
            brand: 1,
            imageUrl: 1,
            isbn: 1,
            isbn13: 1,
            asin: 1,
            targetCategoryName: 1,
            targetSellPrice: 1,
            sourceBuyPrice: 1,
            targetMarket: 1,
            sourceMarket: 1,
            createdAt: 1,
            updatedAt: 1,
            marketStats: 1,
          },
        },
      )) as AtlasProductDocument | null;

      return document ? normalizeAtlasProduct(document) : undefined;
    }

    await dbConnect();

    const total = await BookModel.estimatedDocumentCount();
    if (total === 0) {
      return null;
    }

    const book = await BookModel.findOne({ slug }).lean();
    return book ? normalizeBook(book as BookDocument) : undefined;
  } catch (error) {
    console.error("Failed to read book from MongoDB.", error);
    return null;
  }
}

export async function getBooks(filters: BookFilters = {}) {
  const mongoBooks = await readBooksFromMongo(filters);
  if (mongoBooks !== null) {
    return mongoBooks;
  }

  return filterLocalBooks(sampleBooks, filters);
}

export async function getBookBySlug(slug: string) {
  const mongoBook = await readBookFromMongo(slug);
  if (mongoBook !== null) {
    return mongoBook ?? null;
  }

  return sampleBooks.find((book) => book.slug === slug) ?? null;
}

export async function getBookCount(filters: BookFilters = {}) {
  if (isMongoConfigured) {
    try {
      if (usesAtlasProductsCollection()) {
        const connection = await dbConnect();
        const db = connection?.connection.db;

        if (db) {
          return db
            .collection(MONGODB_BOOKS_COLLECTION)
            .countDocuments(buildAtlasProductsFilter(filters));
        }
      } else {
        await dbConnect();

        const query: Record<string, unknown> = {};

        if (filters.genre && filters.genre !== "All") {
          query.genre = filters.genre;
        }

        if (filters.featured) {
          query.featured = true;
        }

        if (filters.query) {
          const regex = new RegExp(escapeRegExp(filters.query), "i");
          query.$or = [
            { title: regex },
            { author: regex },
            { genre: regex },
            { format: regex },
            { tags: regex },
          ];
        }

        return BookModel.countDocuments(query);
      }
    } catch (error) {
      console.error("Failed to count books from MongoDB.", error);
    }
  }

  return filterLocalBooks(sampleBooks, filters).length;
}

export async function getCatalogStats(): Promise<CatalogStats> {
  const [titleCount, genres] = await Promise.all([getBookCount(), getGenres()]);
  return {
    titleCount,
    genreCount: genres.length,
  };
}

export async function getGenres() {
  if (isMongoConfigured) {
    try {
      if (usesAtlasProductsCollection()) {
        const connection = await dbConnect();
        const db = connection?.connection.db;

        if (db) {
          const genres = await db.collection(MONGODB_BOOKS_COLLECTION).distinct(
            "targetCategoryName",
            {
              isbn: { $type: "string", $ne: "" },
              targetCategoryName: { $type: "string", $ne: "" },
            },
          );

          return genres.filter(Boolean).sort();
        }
      } else {
        await dbConnect();

        const total = await BookModel.estimatedDocumentCount();
        if (total > 0) {
          return BookModel.distinct("genre");
        }
      }
    } catch (error) {
      console.error("Failed to read genres from MongoDB.", error);
    }
  }

  return Array.from(new Set(sampleBooks.map((book) => book.genre))).sort();
}

export async function getInventoryBooks(limit?: number) {
  if (!isMongoConfigured) {
    return [...sampleBooks]
      .sort((left, right) => {
        return left.inventory - right.inventory || left.title.localeCompare(right.title);
      })
      .slice(0, limit);
  }

  try {
    if (usesAtlasProductsCollection()) {
      const documents = await readAtlasProductDocuments(
        {},
        { sortByTitle: true, limit: limit ?? 0 },
      );

      if (!documents) {
        return [];
      }

      return documents.map((document) => normalizeAtlasProduct(document));
    }

    await dbConnect();

    const cursor = BookModel.find({})
      .sort({ inventory: 1, title: 1 })
      .lean();

    if (limit) {
      cursor.limit(limit);
    }

    const books = await cursor;
    return books.map((book) => normalizeBook(book as BookDocument));
  } catch (error) {
    console.error("Failed to read inventory books from MongoDB.", error);
    return [];
  }
}

function assertCatalogIsWritable() {
  if (isMongoCatalogReadOnly) {
    throw new Error(
      `The connected MongoDB catalog source (${MONGODB_BOOKS_COLLECTION}) is configured as read-only.`,
    );
  }
}

export async function createBook(input: CreateBookInput) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  assertCatalogIsWritable();
  await dbConnect();

  const title = input.title.trim();
  const slug = slugify(input.slug?.trim() || title);

  if (!title || !slug) {
    throw new Error("Title and slug are required.");
  }

  const existingBook = await BookModel.findOne({ slug }).lean();
  if (existingBook) {
    throw new Error("A book with this slug already exists.");
  }

  const payload = {
    ...buildBookPayload(input, slug),
    rating: 0,
    reviewCount: 0,
  };

  const createdBook = await BookModel.create(payload);
  return normalizeBook(createdBook.toObject() as BookDocument);
}

export async function updateBookBySlug(
  currentSlug: string,
  input: CreateBookInput,
) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  assertCatalogIsWritable();
  await dbConnect();

  const existingBook = await BookModel.findOne({ slug: currentSlug }).lean();

  if (!existingBook) {
    throw new Error("Book not found.");
  }

  const title = input.title.trim();
  const nextSlug = slugify(input.slug?.trim() || title);

  if (!title || !nextSlug) {
    throw new Error("Title and slug are required.");
  }

  if (nextSlug !== currentSlug) {
    const duplicateBook = await BookModel.findOne({ slug: nextSlug }).lean();

    if (duplicateBook) {
      throw new Error("A book with this slug already exists.");
    }
  }

  const payload = buildBookPayload(input, nextSlug);
  const { imageUrl, compareAtPrice, badge, ...requiredPayload } = payload;
  const $set: Record<string, unknown> = { ...requiredPayload };
  const $unset: Record<string, 1> = {};

  if (imageUrl === undefined) {
    $unset.imageUrl = 1;
  } else {
    $set.imageUrl = imageUrl;
  }

  if (compareAtPrice === undefined) {
    $unset.compareAtPrice = 1;
  } else {
    $set.compareAtPrice = compareAtPrice;
  }

  if (badge === undefined) {
    $unset.badge = 1;
  } else {
    $set.badge = badge;
  }

  const updatedBook = await BookModel.findOneAndUpdate(
    { slug: currentSlug },
    {
      $set,
      ...(Object.keys($unset).length ? { $unset } : {}),
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!updatedBook) {
    throw new Error("Book not found.");
  }

  return normalizeBook(updatedBook as BookDocument);
}

export async function deleteBookBySlug(slug: string) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  assertCatalogIsWritable();
  await dbConnect();

  const deletedBook = await BookModel.findOneAndDelete({ slug }).lean();

  if (!deletedBook) {
    throw new Error("Book not found.");
  }

  return normalizeBook(deletedBook as BookDocument);
}

export async function seedBooks() {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

  assertCatalogIsWritable();
  await dbConnect();

  const existing = await BookModel.estimatedDocumentCount();
  if (existing > 0) {
    return {
      inserted: 0,
      total: existing,
      seeded: false,
    };
  }

  const result = await BookModel.insertMany(sampleBooks);
  return {
    inserted: result.length,
    total: result.length,
    seeded: true,
  };
}
