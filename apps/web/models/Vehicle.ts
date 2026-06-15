import { model, models, Schema, type Model } from "mongoose";

export interface VehicleDocument {
  name: string;
  vehicleNumber: string;
  capacity: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<VehicleDocument>(
  {
    name: { type: String, required: true },
    vehicleNumber: { type: String, required: true, unique: true },
    capacity: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Vehicle =
  (models.Vehicle as Model<VehicleDocument>) ||
  model<VehicleDocument>("Vehicle", VehicleSchema);

export default Vehicle;
