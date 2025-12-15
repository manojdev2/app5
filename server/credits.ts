"use strict";
"use server";

import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/db/mongodb";
import User from "@/db/models/User";
import { logger } from "@/lib/logger";

export async function getUserCredits(): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) {
      return 0;
    }

    await connectDB();
    
    // Use findOneAndUpdate with upsert for atomic operation
    // This ensures user is created with 100 credits even if there are race conditions
    try {
      const dbUser = await User.findOneAndUpdate(
        { clerkId: user.id },
        {
          $setOnInsert: { 
            clerkId: user.id,
            credits: 1000 // Starting credits (1 free plan) - only set on insert
          }
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return updated document
          runValidators: true,
        }
      );

      if (dbUser) {
        logger.log(`✅ User ${user.id} has ${dbUser.credits || 0} credits`);
        return dbUser.credits || 0;
      }
    } catch (upsertError: any) {
      // If upsert fails due to duplicate key, try to find existing user
      if (upsertError.code === 11000 || upsertError.codeName === 'DuplicateKey') {
        logger.warn(`Upsert failed for user ${user.id}, trying to find existing user...`);
        const existingUser = await User.findOne({ clerkId: user.id });
        if (existingUser) {
          logger.log(`Found existing user ${user.id} with ${existingUser.credits || 0} credits`);
          return existingUser.credits || 0;
        }
        // If still not found, log error but don't throw
        logger.error(`Duplicate key error but user not found. This might indicate an old 'userId' index.`);
        logger.error(`Please run: node fix-database-index.js to fix this issue.`);
      } else {
        // For other errors, log and return 0
        logger.error("Error in getUserCredits upsert:", upsertError);
      }
    }

    // Fallback: try one more time with findOne
    const fallbackUser = await User.findOne({ clerkId: user.id });
    if (fallbackUser) {
      return fallbackUser.credits || 0;
    }

    // Last resort: return 0 (user creation failed or database issue)
    logger.error(`Could not create or find user ${user.id}. Returning 0 credits.`);
    return 0;
  } catch (error: any) {
    logger.error("Error fetching user credits:", error);
    return 0;
  }
}

export async function addCredits(amount: number): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    await connectDB();
    
    const dbUser = await User.findOne({ clerkId: user.id });
    
    if (!dbUser) {
      throw new Error("User not found");
    }

    dbUser.credits = (dbUser.credits || 0) + amount;
    await dbUser.save();

    return true;
  } catch (error) {
    logger.error("Error adding credits:", error);
    return false;
  }
}

export async function deductCredits(amount: number): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    await connectDB();
    
    const dbUser = await User.findOne({ clerkId: user.id });
    
    if (!dbUser || (dbUser.credits || 0) < amount) {
      return false;
    }

    dbUser.credits = (dbUser.credits || 0) - amount;
    await dbUser.save();

    return true;
  } catch (error) {
    logger.error("Error deducting credits:", error);
    return false;
  }
}


