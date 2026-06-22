import mongoose, { type Model, type Types } from "mongoose";

export interface AssignmentDocument {
    supplyPoint: Types.ObjectId;
    driver: Types.ObjectId;
    tankerType: string;
    frequency: "once" | "daily";
    scheduledDate: Date;
    status: "pending" | "completed";
    completedAt?: Date;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AssignmentSchema = new mongoose.Schema<AssignmentDocument>(
    {
        supplyPoint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WaterSupplyPoint",
            required: true,
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tankerType: {
            type: String,
            required: true,
        },
        frequency: {
            type: String,
            enum: ["once", "daily"],
            default: "once",
        },
        scheduledDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
        },
        completedAt: { type: Date },
        remark: { type: String },
    },
    { timestamps: true }
);

AssignmentSchema.index({ driver: 1, scheduledDate: -1 });
AssignmentSchema.index({ status: 1, scheduledDate: -1 });
AssignmentSchema.index({ supplyPoint: 1, scheduledDate: -1 });

const Assignment =
    (mongoose.models.Assignment as Model<AssignmentDocument>) ||
    mongoose.model<AssignmentDocument>("Assignment", AssignmentSchema);

export default Assignment;
