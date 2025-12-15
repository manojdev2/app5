"use strict";
"use server";

import connectDB from "@/db/mongodb";
import User from "@/db/models/User";
import Plan from "@/db/models/Plan";
import { clerkClient } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { ValidationError, DatabaseError } from "@/lib/errors";

export interface UserData {
  _id: string;
  clerkId: string;
  email?: string;
  credits: number;
  planCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    await connectDB();
    const users = await User.find().sort({ createdAt: -1 });
    
    // Fetch emails from Clerk - handle errors gracefully for deleted/invalid users
    const usersWithEmail = await Promise.allSettled(
      users.map(async (user) => {
        let email: string | undefined;
        try {
          const clerkUser = await clerkClient.users.getUser(user.clerkId);
          email = clerkUser.emailAddresses[0]?.emailAddress;
        } catch (error: unknown) {
          // User might be deleted from Clerk but still exists in our DB
          // This is fine - we'll just show "N/A" for email
          if (error instanceof Error && error.message.includes("Not Found")) {
            logger.warn(`User ${user.clerkId} not found in Clerk (may have been deleted)`);
          } else {
            logger.warn(`Failed to fetch email for user ${user.clerkId}:`, error);
          }
        }
        
        // Get plan count for this user
        const planCount = await Plan.countDocuments({ userId: user.clerkId });
        
        return {
          _id: user._id.toString(),
          clerkId: user.clerkId,
          email,
          credits: user.credits,
          planCount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })
    );
    
    // Extract successful results, filter out failed ones
    return usersWithEmail
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<UserData>).value);
  } catch (error: unknown) {
    logger.error("Error fetching users:", error);
    throw new DatabaseError("Failed to fetch users");
  }
}

export async function getUserById(userId: string): Promise<UserData | null> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return null;
    
    let email: string | undefined;
    try {
      const clerkUser = await clerkClient.users.getUser(user.clerkId);
      email = clerkUser.emailAddresses[0]?.emailAddress;
    } catch (error: unknown) {
      // User might be deleted from Clerk but still exists in our DB
      // This is fine - we'll just show "N/A" for email
      if (error instanceof Error && error.message.includes("Not Found")) {
        logger.warn(`User ${user.clerkId} not found in Clerk (may have been deleted)`);
      } else {
        logger.warn(`Failed to fetch email for user ${user.clerkId}:`, error);
      }
    }
    
    // Get plan count for this user
    const planCount = await Plan.countDocuments({ userId: user.clerkId });
    
    return {
      _id: user._id.toString(),
      clerkId: user.clerkId,
      email,
      credits: user.credits,
      planCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error: unknown) {
    logger.error("Error fetching user:", error);
    throw new DatabaseError("Failed to fetch user");
  }
}

export async function getUserPlans(clerkId: string): Promise<Array<{
  _id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}>> {
  try {
    await connectDB();
    const plans = await Plan.find({ userId: clerkId })
      .sort({ createdAt: -1 })
      .select("destination startDate endDate createdAt")
      .limit(50); // Limit to recent 50 plans
    
    return plans.map((plan: any) => ({
      _id: plan._id?.toString() || "",
      destination: plan.destination || "Unknown",
      startDate: plan.startDate,
      endDate: plan.endDate,
      createdAt: plan.createdAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching user plans:", error);
    throw new DatabaseError("Failed to fetch user plans");
  }
}

export async function createUser(email: string, password: string, initialCredits: number = 0): Promise<UserData> {
  try {
    if (!email || !email.includes("@")) {
      throw new ValidationError("Valid email address is required");
    }
    if (!password || password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }
    if (initialCredits < 0) {
      throw new ValidationError("Initial credits cannot be negative");
    }

    await connectDB();
    
    // Check if user with this email already exists in Clerk
    try {
      const existingClerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });
      if (existingClerkUsers.data.length > 0) {
        const existingClerkUser = existingClerkUsers.data[0];
        // Check if user already exists in our DB
        const existingDbUser = await User.findOne({ clerkId: existingClerkUser.id });
        if (existingDbUser) {
          throw new ValidationError(`User with email ${email} already exists`);
        }
        // User exists in Clerk but not in our DB, create DB record
        const user = new User({
          clerkId: existingClerkUser.id,
          credits: initialCredits,
        });
        const saved = await user.save();
        logger.log(`Created DB record for existing Clerk user: ${saved.clerkId} with ${saved.credits} credits`);
        
        const planCount = await Plan.countDocuments({ userId: saved.clerkId });
        return {
          _id: saved._id.toString(),
          clerkId: saved.clerkId,
          email: existingClerkUser.emailAddresses[0]?.emailAddress,
          credits: saved.credits,
          planCount,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
        };
      }
    } catch (error: unknown) {
      // If error is our ValidationError, re-throw it
      if (error instanceof ValidationError) {
        throw error;
      }
      // Otherwise, continue to create new user in Clerk
    }

    // Create user in Clerk first
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        skipPasswordChecks: false,
        skipPasswordRequirement: false,
      });
    } catch (clerkError: unknown) {
      // Handle Clerk-specific errors
      if (clerkError && typeof clerkError === "object" && "errors" in clerkError) {
        const clerkErr = clerkError as { errors?: Array<{ code?: string; message?: string; longMessage?: string }> };
        if (clerkErr.errors && clerkErr.errors.length > 0) {
          const errorMessage = clerkErr.errors[0]?.longMessage || clerkErr.errors[0]?.message || "Failed to create user";
          
          // Map Clerk error codes to user-friendly messages
          if (clerkErr.errors[0]?.code === "form_password_pwned") {
            throw new ValidationError("Password has been found in an online data breach. Please use a different, stronger password.");
          } else if (clerkErr.errors[0]?.code === "form_password_length_too_short") {
            throw new ValidationError("Password is too short. Please use at least 8 characters.");
          } else if (clerkErr.errors[0]?.code === "form_password_not_strong_enough") {
            throw new ValidationError("Password is not strong enough. Please use a combination of letters, numbers, and special characters.");
          } else if (clerkErr.errors[0]?.code === "form_identifier_exists") {
            throw new ValidationError(`A user with email ${email} already exists.`);
          } else {
            throw new ValidationError(errorMessage);
          }
        }
      }
      throw new ValidationError("Failed to create user in Clerk. Please check your input and try again.");
    }

    if (!clerkUser.id) {
      throw new DatabaseError("Failed to create user in Clerk");
    }

    // Check if user already exists in our DB (shouldn't happen, but just in case)
    const existing = await User.findOne({ clerkId: clerkUser.id });
    if (existing) {
      throw new ValidationError(`User with Clerk ID ${clerkUser.id} already exists`);
    }

    // Create user record in our database
    const user = new User({
      clerkId: clerkUser.id,
      credits: initialCredits,
    });

    const saved = await user.save();
    logger.log(`Created user in Clerk and DB: ${saved.clerkId} with ${saved.credits} credits`);

    // Get plan count for this user
    const planCount = await Plan.countDocuments({ userId: saved.clerkId });
    
    return {
      _id: saved._id.toString(),
      clerkId: saved.clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      credits: saved.credits,
      planCount,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error creating user:", error);
    throw new DatabaseError("Failed to create user");
  }
}

export async function addCreditsToUser(userId: string, credits: number): Promise<void> {
  try {
    if (credits <= 0) {
      throw new ValidationError("Credits must be greater than 0");
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      throw new ValidationError("User not found");
    }

    user.credits = (user.credits || 0) + credits;
    await user.save();
    logger.log(`Added ${credits} credits to user ${userId}. New total: ${user.credits}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error adding credits:", error);
    throw new DatabaseError("Failed to add credits");
  }
}

export async function updateUserCredits(userId: string, credits: number): Promise<void> {
  try {
    if (credits < 0) {
      throw new ValidationError("Credits cannot be negative");
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      throw new ValidationError("User not found");
    }

    user.credits = credits;
    await user.save();
    logger.log(`Updated credits for user ${userId} to ${credits}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error updating credits:", error);
    throw new DatabaseError("Failed to update credits");
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      throw new ValidationError("User not found");
    }

    await User.findByIdAndDelete(userId);
    logger.log(`Deleted user ${userId}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error deleting user:", error);
    throw new DatabaseError("Failed to delete user");
  }
}

export async function cleanupOrphanedUsers(): Promise<{ deleted: number; total: number }> {
  try {
    await connectDB();
    const users = await User.find();
    let deleted = 0;
    const total = users.length;

    for (const user of users) {
      try {
        // Try to fetch user from Clerk
        await clerkClient.users.getUser(user.clerkId);
        // If successful, user exists in Clerk, keep it
      } catch (error: unknown) {
        // If user not found in Clerk, delete from our DB
        if (error instanceof Error && (error.message.includes("Not Found") || error.message.includes("not found"))) {
          await User.findByIdAndDelete(user._id);
          deleted++;
          logger.log(`Deleted orphaned user: ${user.clerkId}`);
        }
      }
    }

    return { deleted, total };
  } catch (error: unknown) {
    logger.error("Error cleaning up orphaned users:", error);
    throw new DatabaseError("Failed to cleanup orphaned users");
  }
}
