import { model, models, Schema, type Model, type Types } from "mongoose";

export interface SupplyLogDocument {
  driver: Types.ObjectId;
  vehicle?: Types.ObjectId;
  customer?: Types.ObjectId;
  pointName?: string;
  cansDelivered?: number;
  cansTakenBack?: number;
  suppliedAt: Date;
  notes?: string;
  amount?: number;
  logType: "water" | "cash";
  cashType?: "debit" | "fuel";
  paymentStatus?: "cash" | "upi" | "not_paid";
  adminRemark?: string;
  billImageUrl?: string;
  billImagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplyLogSchema = new Schema<SupplyLogDocument>(
  {
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    pointName: { type: String },
    cansDelivered: { type: Number },
    cansTakenBack: { type: Number, min: 0 },
    suppliedAt: { type: Date, required: true },
    notes: { type: String },
    amount: { type: Number },
    logType: {
      type: String,
      enum: ["water", "cash"],
      default: "water",
      required: true,
    },
    cashType: {
      type: String,
      enum: ["debit", "fuel"],
    },
    paymentStatus: { type: String, enum: ["cash", "upi", "not_paid"] },
    adminRemark: { type: String },
    billImageUrl: { type: String },
    billImagePublicId: { type: String },
  },
  { timestamps: true }
);

SupplyLogSchema.index({ driver: 1, suppliedAt: -1 });
SupplyLogSchema.index({ suppliedAt: -1 });
SupplyLogSchema.index({ logType: 1, suppliedAt: -1 });
SupplyLogSchema.index({ logType: 1, driver: 1, suppliedAt: -1 });
SupplyLogSchema.index({ customer: 1, suppliedAt: -1 });

const SupplyLog =
  (models.SupplyLog as Model<SupplyLogDocument>) ||
  model<SupplyLogDocument>("SupplyLog", SupplyLogSchema);

export default SupplyLog;
