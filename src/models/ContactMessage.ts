import {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
} from "mongoose";

const contactMessageSchema = new Schema(
  {
    userId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "reviewed"],
      default: "new",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ContactMessageDocument = InferSchemaType<typeof contactMessageSchema>;

export const ContactMessageModel =
  (models.ContactMessage as Model<ContactMessageDocument>) ||
  model<ContactMessageDocument>("ContactMessage", contactMessageSchema);
