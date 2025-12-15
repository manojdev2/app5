"use strict";
"use server";

import connectDB from "@/db/mongodb";
import Admin from "@/db/models/Admin";
import { hashPassword, verifyPassword, createAdminSession, deleteAdminSession } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { AuthenticationError, ValidationError } from "@/lib/errors";

export async function adminLogin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isValidPassword = await verifyPassword(password, admin.password);
    if (!isValidPassword) {
      throw new AuthenticationError("Invalid email or password");
    }

    await createAdminSession(admin._id.toString());
    logger.log(`Admin ${email} logged in successfully`);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      throw error;
    }
    logger.error("Admin login error:", error);
    throw new AuthenticationError("Failed to login");
  }
}

export async function adminLogout(): Promise<void> {
  await deleteAdminSession();
  logger.log("Admin logged out");
}

export async function createInitialAdmin(email: string, password: string): Promise<void> {
  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      throw new ValidationError("Admin with this email already exists");
    }

    const hashedPassword = await hashPassword(password);
    const admin = new Admin({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await admin.save();
    logger.log(`Initial admin created: ${email}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error creating initial admin:", error);
    throw new Error("Failed to create admin");
  }
}

