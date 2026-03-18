import { sampleBooks } from "@/data/sample-books";
import { dbConnect, isMongoConfigured } from "@/lib/mongodb";
import { BookModel, type BookDocument } from "@/models/Book";
import type { Book, BookFilters, CreateBookInput } from "@/types/book";

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
      right.publishedYear - left.publishedYear
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

async function readBooksFromMongo(filters: BookFilters) {
  if (!isMongoConfigured) {
    return null;
  }

  try {
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

async function readBookFromMongo(slug: string) {
  if (!isMongoConfigured) {
    return null;
  }

  try {
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

export async function getGenres() {
  if (isMongoConfigured) {
    try {
      await dbConnect();

      const total = await BookModel.estimatedDocumentCount();
      if (total > 0) {
        return BookModel.distinct("genre");
      }
    } catch (error) {
      console.error("Failed to read genres from MongoDB.", error);
    }
  }

  return Array.from(new Set(sampleBooks.map((book) => book.genre))).sort();
}

export async function getInventoryBooks() {
  if (!isMongoConfigured) {
    return [...sampleBooks].sort((left, right) => {
      return left.inventory - right.inventory || left.title.localeCompare(right.title);
    });
  }

  try {
    await dbConnect();

    const books = await BookModel.find({})
      .sort({ inventory: 1, title: 1 })
      .lean();

    return books.map((book) => normalizeBook(book as BookDocument));
  } catch (error) {
    console.error("Failed to read inventory books from MongoDB.", error);
    return [];
  }
}

export async function createBook(input: CreateBookInput) {
  if (!isMongoConfigured) {
    throw new Error("MONGODB_URI is not configured.");
  }

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
  const {
    imageUrl,
    compareAtPrice,
    badge,
    ...requiredPayload
  } = payload;
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
