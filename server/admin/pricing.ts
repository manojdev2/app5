"use strict";
"use server";

import connectDB from "@/db/mongodb";
import PricingPlan from "@/db/models/PricingPlan";
import { logger } from "@/lib/logger";
import { ValidationError, DatabaseError } from "@/lib/errors";

const CREDITS_PER_PLAN = 100;

export interface PricingPlanData {
  _id: string;
  planId: number;
  credits: number;
  price: number;
  popular: boolean;
  plans: number;
  isLive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAllPricingPlans(): Promise<PricingPlanData[]> {
  try {
    await connectDB();
    const plans = await PricingPlan.find().sort({ planId: 1 });
    return plans.map((plan) => ({
      _id: plan._id.toString(),
      planId: plan.planId,
      credits: plan.credits,
      price: plan.price,
      popular: plan.popular,
      plans: plan.plans,
      isLive: plan.isLive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching pricing plans:", error);
    throw new DatabaseError("Failed to fetch pricing plans");
  }
}

export async function getLivePricingPlans(): Promise<PricingPlanData[]> {
  try {
    await connectDB();
    const plans = await PricingPlan.find({ isLive: true }).sort({ planId: 1 });
    return plans.map((plan) => ({
      _id: plan._id.toString(),
      planId: plan.planId,
      credits: plan.credits,
      price: plan.price,
      popular: plan.popular,
      plans: plan.plans,
      isLive: plan.isLive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching live pricing plans:", error);
    throw new DatabaseError("Failed to fetch live pricing plans");
  }
}

export async function createPricingPlan(
  planId: number,
  credits: number,
  price: number,
  popular: boolean = false
): Promise<PricingPlanData> {
  try {
    if (credits <= 0 || price <= 0) {
      throw new ValidationError("Credits and price must be greater than 0");
    }

    await connectDB();

    // Check if planId already exists
    const existing = await PricingPlan.findOne({ planId });
    if (existing) {
      throw new ValidationError(`Plan with ID ${planId} already exists`);
    }

    const plans = Math.floor(credits / CREDITS_PER_PLAN);

    const pricingPlan = new PricingPlan({
      planId,
      credits,
      price,
      popular,
      plans,
      isLive: true,
    });

    const saved = await pricingPlan.save();
    logger.log(`Created pricing plan: ${saved.planId} - ${saved.credits} credits`);

    return {
      _id: saved._id.toString(),
      planId: saved.planId,
      credits: saved.credits,
      price: saved.price,
      popular: saved.popular,
      plans: saved.plans,
      isLive: saved.isLive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error creating pricing plan:", error);
    throw new DatabaseError("Failed to create pricing plan");
  }
}

export async function updatePricingPlan(
  id: string,
  updates: {
    credits?: number;
    price?: number;
    popular?: boolean;
    isLive?: boolean;
    plans?: number;
  }
): Promise<PricingPlanData> {
  try {
    await connectDB();
    const plan = await PricingPlan.findById(id);
    if (!plan) {
      throw new ValidationError("Pricing plan not found");
    }

    if (updates.credits !== undefined) {
      if (updates.credits <= 0) {
        throw new ValidationError("Credits must be greater than 0");
      }
      plan.credits = updates.credits;
      // Only auto-calculate plans if plans is not explicitly provided
      if (updates.plans === undefined) {
        plan.plans = Math.floor(plan.credits / CREDITS_PER_PLAN);
      }
    }
    if (updates.plans !== undefined) {
      if (updates.plans <= 0) {
        throw new ValidationError("Plans must be greater than 0");
      }
      plan.plans = updates.plans;
    }
    if (updates.price !== undefined) {
      if (updates.price <= 0) {
        throw new ValidationError("Price must be greater than 0");
      }
      plan.price = updates.price;
    }
    if (updates.popular !== undefined) plan.popular = updates.popular;
    if (updates.isLive !== undefined) plan.isLive = updates.isLive;

    const saved = await plan.save();
    logger.log(`Updated pricing plan: ${saved.planId}`);

    return {
      _id: saved._id.toString(),
      planId: saved.planId,
      credits: saved.credits,
      price: saved.price,
      popular: saved.popular,
      plans: saved.plans,
      isLive: saved.isLive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error updating pricing plan:", error);
    throw new DatabaseError("Failed to update pricing plan");
  }
}

export async function deletePricingPlan(id: string): Promise<void> {
  try {
    await connectDB();
    const plan = await PricingPlan.findById(id);
    if (!plan) {
      throw new ValidationError("Pricing plan not found");
    }

    await PricingPlan.findByIdAndDelete(id);
    logger.log(`Deleted pricing plan: ${plan.planId}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error deleting pricing plan:", error);
    throw new DatabaseError("Failed to delete pricing plan");
  }
}

