
import mongoose, { Schema, model } from "mongoose";

export type UserRole =
  | "admin"
  | "customer"
  | "seller"
  | "technician";

export interface IUser {
  _id: mongoose.Types.ObjectId | string;

  name: string;
  email: string;
  password: string;
  phone?: string | null;
  company?: string | null;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  permissions: string[];

  role: UserRole;
  isActive: boolean;

  passwordResetToken?: string;
  passwordResetExpires?: Date;

  passwordChangedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    company: {
      type: String,
      default: null,
      trim: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    permissions: {
      type: [String],
      default: [],
    },

    role: {
      type: String,
      enum: ["admin", "customer", "seller", "technician"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default model<IUser>("User", userSchema);
