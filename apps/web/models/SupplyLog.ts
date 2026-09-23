import { model, models, Schema, type Model, type Types } from "mongoose";
import { CASE_SIZES, type CaseSize } from "../lib/supplyProduct";

export interface SupplyLogDocument {
  driver: Types.ObjectId;
  vehicle?: Types.ObjectId;
  customer?: Types.ObjectId;
  pointName?: string;
  cansDelivered?: number;
  cansTakenBack?: number;
  casesDelivered?: number;
  caseSize?: CaseSize;
  // ₹ for one case, entered with the delivery; amount = casesDelivered × casePrice.
  casePrice?: number;
  suppliedAt: Date;
  notes?: string;
  amount?: number;
  logType: "water" | "cash";
  // Absent on cash rows and on deliveries saved before the field existed;
  // read it through toProductType() from lib/supplyProduct.
  productType?: "can" | "case";
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
    casesDelivered: { type: Number, min: 1 },
    caseSize: { type: String, enum: CASE_SIZES },
    casePrice: { type: Number, min: 0 },
    suppliedAt: { type: Date, required: true },
    notes: { type: String },
    amount: { type: Number },
    logType: {
      type: String,
      enum: ["water", "cash"],
      default: "water",
      required: true,
    },
    // Water rows only. A row carries exactly one quantity family matching it:
    // cansDelivered (+ cansTakenBack) for "can"; casesDelivered, caseSize and
    // casePrice for "case".
    // Older rows have no productType and count as "can", so filter cans with
    // { productType: { $ne: "case" } }, never { productType: "can" }.
    productType: { type: String, enum: ["can", "case"] },
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
