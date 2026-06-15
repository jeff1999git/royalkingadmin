import { model, models, Schema, type Model, type Types } from "mongoose";

export type UserRole = "admin" | "driver";

export interface UserDocument {
  name: string;
  username: string;
  phone: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  assignedVehicle?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "driver"],
      default: "driver",
    },
    isActive: { type: Boolean, default: true },
    assignedVehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
  },
  { timestamps: true }
);

const ExistingUserModel = models.User as Model<UserDocument> | undefined;

if (ExistingUserModel && !ExistingUserModel.schema.path("assignedVehicle")) {
  ExistingUserModel.schema.add({
    assignedVehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
  });
}

const User = ExistingUserModel || model<UserDocument>("User", UserSchema);

export default User;
