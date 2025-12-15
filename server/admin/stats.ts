"use strict";
"use server";

import connectDB from "@/db/mongodb";
import User from "@/db/models/User";
import Plan from "@/db/models/Plan";
import Transaction from "@/db/models/Transaction";
import { logger } from "@/lib/logger";
import { DatabaseError } from "@/lib/errors";

export interface AdminStats {
  totalUsers: number;
  totalPlans: number;
  totalRevenue: number; // In cents
  totalPurchasedCredits: number;
  usersOverTime?: Array<{ date: string; count: number }>;
  plansOverTime?: Array<{ date: string; count: number }>;
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    await connectDB();

    const [totalUsers, totalPlans, transactions, allUsers, allPlans] = await Promise.all([
      User.countDocuments(),
      Plan.countDocuments(),
      Transaction.find({ status: "completed" }),
      User.find().select("createdAt"),
      Plan.find().select("createdAt"),
    ]);

    const totalRevenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const totalPurchasedCredits = transactions.reduce((sum, txn) => sum + txn.credits, 0);

    // Generate time series data for the last 30 days
    const days = 30;
    const now = new Date();
    const usersOverTime: Array<{ date: string; count: number }> = [];
    const plansOverTime: Array<{ date: string; count: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const usersCount = allUsers.filter(
        (u) => u.createdAt && new Date(u.createdAt).toISOString().split("T")[0] <= dateStr
      ).length;

      const plansCount = allPlans.filter(
        (p) => p.createdAt && new Date(p.createdAt).toISOString().split("T")[0] <= dateStr
      ).length;

      usersOverTime.push({ date: dateStr, count: usersCount });
      plansOverTime.push({ date: dateStr, count: plansCount });
    }

    return {
      totalUsers,
      totalPlans,
      totalRevenue,
      totalPurchasedCredits,
      usersOverTime,
      plansOverTime,
    };
  } catch (error: unknown) {
    logger.error("Error fetching admin stats:", error);
    throw new DatabaseError("Failed to fetch admin statistics");
  }
}

