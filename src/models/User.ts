import {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
} from "mongoose";

const addressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, uppercase: true },
    phone: { type: String, trim: true },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    stripeCustomerId: { type: String, trim: true },
    billingAddress: { type: addressSchema },
    shippingAddress: { type: addressSchema },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel =
  (models.User as Model<UserDocument>) ||
  model<UserDocument>("User", userSchema);
