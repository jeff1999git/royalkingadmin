import { model, models, Schema, type Model, type Types } from "mongoose";

export interface WaterSupplyPointDocument {
    name: string;
    address?: string;
    tankerTypes: string[];
    isActive: boolean;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const WaterSupplyPointSchema = new Schema<WaterSupplyPointDocument>(
    {
        name: { type: String, required: true },
        address: { type: String, default: "" },
        tankerTypes: {
            type: [String],
            required: true,
            validate: {
                validator: (arr: string[]) => arr.length > 0,
                message: "A supply point must have at least one tanker type.",
            },
        },
        isActive: { type: Boolean, default: true },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const WaterSupplyPoint =
    (models.WaterSupplyPoint as Model<WaterSupplyPointDocument>) ||
    model<WaterSupplyPointDocument>("WaterSupplyPoint", WaterSupplyPointSchema);

export default WaterSupplyPoint;
