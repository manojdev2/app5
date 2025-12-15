"use strict";

import connectDB from "@/db/mongodb";
import Plan, { IPlan } from "@/db/models/Plan";
import { currentUser } from "@clerk/nextjs/server";
import { Plan as PlanType } from "@/components/shared/types";
import mongoose from "mongoose";
import { logger } from "@/lib/logger";

export async function getPlan(id: string): Promise<PlanType | null> {
  try {
    await connectDB();
    const plan = await Plan.findById(id) as IPlan | null;
    
    if (!plan) {
      return null;
    }

    return {
      id: (plan._id as mongoose.Types.ObjectId).toString(),
      text: plan.text,
      budget: plan.budget,
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate.toISOString(),
      destination: plan.destination,
      destinationCountry: plan.destinationCountry,
      destinationLat: plan.destinationLat,
      destinationLng: plan.destinationLng,
      destinationImage: plan.destinationImage,
      currency: plan.currency,
      weatherData: plan.weatherData,
      placesData: plan.placesData,
      createdAt: plan.createdAt,
    };
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getPlansByUser(): Promise<PlanType[]> {
  try {
    const user = await currentUser();

    if (!user) {
      // Return empty array instead of throwing error for unauthenticated users
      logger.log("No user found, returning empty plans array");
      return [];
    }

    await connectDB();
    const plans = await Plan.find({ userId: user.id }).sort({ createdAt: -1 }) as IPlan[];
    
    return plans.map((plan) => ({
      id: (plan._id as mongoose.Types.ObjectId).toString(),
      text: plan.text,
      budget: plan.budget,
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate.toISOString(),
      destination: plan.destination,
      destinationCountry: plan.destinationCountry,
      destinationLat: plan.destinationLat,
      destinationLng: plan.destinationLng,
      destinationImage: plan.destinationImage,
      currency: plan.currency,
      weatherData: plan.weatherData,
      placesData: plan.placesData,
      createdAt: plan.createdAt,
    }));
  } catch (error) {
    logger.error("Error in getPlansByUser:", error);
    // Return empty array on error instead of throwing
    return [];
  }
}
