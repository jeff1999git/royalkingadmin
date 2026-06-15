import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
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

delete mongoose.models.Assignment;
export default mongoose.model("Assignment", AssignmentSchema);
