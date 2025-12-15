"use strict";

import mongoose, { Schema, Document } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  isLive: boolean;
  order: number; // For sorting/ordering FAQs
  createdAt?: Date;
  updatedAt?: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const FAQ = mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", FAQSchema);

export default FAQ;

