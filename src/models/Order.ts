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

const orderLineItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitAmount: { type: Number, required: true, min: 0 },
    amountTotal: { type: Number, required: true, min: 0 },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema(
  {
    checkoutSessionId: { type: String, required: true, unique: true, trim: true },
    userId: { type: String, trim: true },
    paymentStatus: { type: String, required: true, trim: true },
    status: { type: String, trim: true },
    customerEmail: { type: String, trim: true },
    customerName: { type: String, trim: true },
    currency: { type: String, trim: true },
    amountSubtotal: { type: Number, min: 0 },
    amountTotal: { type: Number, min: 0 },
    stripeCustomerId: { type: String, trim: true },
    stripePaymentIntentId: { type: String, trim: true },
    stripeInvoiceId: { type: String, trim: true },
    billingAddress: { type: addressSchema },
    shippingAddress: { type: addressSchema },
    lineItems: { type: [orderLineItemSchema], default: [] },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;

export const OrderModel =
  (models.Order as Model<OrderDocument>) ||
  model<OrderDocument>("Order", orderSchema);
