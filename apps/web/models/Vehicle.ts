import { model, models, Schema, type Model, type Types } from "mongoose";

export interface OdometerEntry {
  reading: number;
  recordedAt: Date;
  driverId: Types.ObjectId;
}

export interface VehicleDocument {
  name: string;
  vehicleNumber: string;
  capacity: string;
  isActive: boolean;
  odometer: number;
  odometerLastUpdated?: Date;
  odometerHistory: OdometerEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<VehicleDocument>(
  {
    name: { type: String, required: true },
    vehicleNumber: { type: String, required: true, unique: true },
    capacity: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    odometer: { type: Number, default: 0 },
    odometerLastUpdated: { type: Date },
    odometerHistory: {
      type: [
        {
          reading: { type: Number, required: true },
          recordedAt: { type: Date, required: true },
          driverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Vehicle =
  (models.Vehicle as Model<VehicleDocument>) ||
  model<VehicleDocument>("Vehicle", VehicleSchema);

export default Vehicle;
