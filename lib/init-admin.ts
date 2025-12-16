"use strict";
"use server";

import connectDB from "@/db/mongodb";
import Admin from "@/db/models/Admin";
import { hashPassword } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

const DEFAULT_ADMIN_EMAIL = "admin@admin.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";

/**
 * Auto-create default admin user if it doesn't exist
 * This runs automatically on app startup (dev/build)
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
    if (existingAdmin) {
      logger.log("Default admin user already exists");
      return;
    }

    // Create default admin
    const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    const admin = new Admin({
      email: DEFAULT_ADMIN_EMAIL,
      password: hashedPassword,
    });

    await admin.save();
    logger.log(`Default admin user created: ${DEFAULT_ADMIN_EMAIL}`);
  } catch (error: unknown) {
    // Log error but don't throw - app should still start even if admin creation fails
    logger.error("Failed to create default admin user:", error);
  }
}

