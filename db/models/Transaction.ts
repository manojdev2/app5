"use strict";

import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: string; // Clerk user ID
  stripeSessionId?: string;
  amount: number; // Amount in cents
  credits: number; // Credits purchased
  status: "pending" | "completed" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;

