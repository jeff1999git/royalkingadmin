import { model, models, Schema, type Model, type Types } from "mongoose";

export interface SupplyLogDocument {
  driver: Types.ObjectId;
  vehicle?: Types.ObjectId;
  pointName?: string;
  suppliedAt: Date;
  notes?: string;
  amount?: number;
  logType: "water" | "cash";
  cashType?: "debit" | "fuel";
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
      required: function requiredVehicle(this: SupplyLogDocument) {
        return this.logType === "water";
      },
    },
    pointName: {
      type: String,
      required: function requiredPointName(this: SupplyLogDocument) {
        return this.logType === "water";
      },
    },
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
    adminRemark: { type: String },
    billImageUrl: { type: String },
    billImagePublicId: { type: String },
  },
  { timestamps: true }
);

const SupplyLog =
  (models.SupplyLog as Model<SupplyLogDocument>) ||
  model<SupplyLogDocument>("SupplyLog", SupplyLogSchema);

export default SupplyLog;
