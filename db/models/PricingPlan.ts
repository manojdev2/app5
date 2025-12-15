"use strict";

import mongoose, { Schema, Document } from "mongoose";

export interface IPricingPlan extends Document {
  planId: number; // Keep existing IDs (1, 2, 3)
  credits: number;
  price: number;
  popular: boolean;
  plans: number; // Calculated: credits / 100 (or CREDITS_PER_PLAN)
  isLive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PricingPlanSchema = new Schema<IPricingPlan>(
  {
    planId: {
      type: Number,
      required: true,
      unique: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    plans: {
      type: Number,
      required: true,
      min: 0,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PricingPlan = mongoose.models.PricingPlan || mongoose.model<IPricingPlan>("PricingPlan", PricingPlanSchema);

export default PricingPlan;

