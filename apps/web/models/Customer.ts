import { model, models, Schema, type Model, type Types } from "mongoose";

export interface CustomerDocument {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  area?: string;
  locationType?: "home" | "office" | "both";
  subscriptionCans: number;
  cashPerCan?: number;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    area: { type: String },
    locationType: { type: String, enum: ["home", "office", "both"] },
    subscriptionCans: { type: Number, default: 1, min: 1 },
    cashPerCan: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

CustomerSchema.index({ isActive: 1, name: 1 });
CustomerSchema.index({ area: 1, isActive: 1 });

const Customer =
  (models.Customer as Model<CustomerDocument>) ||
  model<CustomerDocument>("Customer", CustomerSchema);

export default Customer;
