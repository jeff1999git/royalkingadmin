import mongoose from "mongoose";

const EntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, required: true },
    customerName: { type: String, required: true },
    location: { type: String },
    amountCollected: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ["cash", "gpay", "upi", "credit"],
      default: "cash",
    },
    dieselExpense: { type: Number, default: 0 },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Entry ||
  mongoose.model("Entry", EntrySchema);