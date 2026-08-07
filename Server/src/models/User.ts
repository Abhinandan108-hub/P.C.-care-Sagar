import mongoose, { Schema, model } from "mongoose";

export type UserRole = "admin" | "seller";

export interface IUser {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "seller"], default: "seller" },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
