"use strict";

// Load environment variables FIRST using require (synchronous, before any imports)
const dotenv = require("dotenv");
const { resolve } = require("path");
const { existsSync } = require("fs");

const envPath = resolve(process.cwd(), ".env");
const envLocalPath = resolve(process.cwd(), ".env.local");

// Load .env.local first (if exists), then .env, then default
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

// Verify CLERK_SECRET_KEY is loaded
if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found in environment variables");
  process.exit(1);
}

async function cleanupOrphanedUsers() {
  try {
    // Dynamic import AFTER dotenv is loaded
    const { default: connectDB } = await import("../db/mongodb");
    const { default: User } = await import("../db/models/User");
    const { clerkClient } = await import("@clerk/nextjs/server");
    
    await connectDB();
    
    const users = await User.find();
    let deleted = 0;
    const total = users.length;

    console.log(`\n🔍 Checking ${total} users...\n`);

    for (const user of users) {
      try {
        // Try to fetch user from Clerk
        await clerkClient.users.getUser(user.clerkId);
        // If successful, user exists in Clerk, keep it
        console.log(`✓ User ${user.clerkId} exists in Clerk`);
      } catch (error: unknown) {
        // If user not found in Clerk, delete from our DB
        if (error instanceof Error && (error.message.includes("Not Found") || error.message.includes("not found"))) {
          await User.findByIdAndDelete(user._id);
          deleted++;
          console.log(`✗ Deleted orphaned user: ${user.clerkId}`);
        } else {
          console.log(`⚠ Error checking user ${user.clerkId}:`, error instanceof Error ? error.message : "Unknown error");
        }
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Total users checked: ${total}`);
    console.log(`   Orphaned users deleted: ${deleted}`);
    console.log(`   Remaining users: ${total - deleted}\n`);
    
    return { deleted, total };
  } catch (error: unknown) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  cleanupOrphanedUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

