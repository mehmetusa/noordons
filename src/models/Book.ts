import {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
} from "mongoose";

const bookSchema = new Schema(
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
    palette: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length === 2,
        message: "Palette must contain exactly two colors.",
      },
    },
    description: { type: String, required: true, trim: true },
    longDescription: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type BookDocument = InferSchemaType<typeof bookSchema>;

export const BookModel =
  (models.Book as Model<BookDocument>) ||
  model<BookDocument>("Book", bookSchema);
