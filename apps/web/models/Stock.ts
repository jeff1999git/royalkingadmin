import { model, models, Schema, type Model } from "mongoose";

export interface StockDocument {
  cans: number;
  dispensers: number;
  stands: number;
  updatedBy?: string;
  updatedAt: Date;
  createdAt: Date;
}

const StockSchema = new Schema<StockDocument>(
  {
    cans: { type: Number, default: 0, min: 0 },
    dispensers: { type: Number, default: 0, min: 0 },
    stands: { type: Number, default: 0, min: 0 },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

const Stock =
  (models.Stock as Model<StockDocument>) ||
  model<StockDocument>("Stock", StockSchema);

export default Stock;
