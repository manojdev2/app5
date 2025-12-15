"use strict";
"use server";

import connectDB from "@/db/mongodb";
import Admin from "@/db/models/Admin";
import { hashPassword, verifyPassword } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { ValidationError, DatabaseError } from "@/lib/errors";

export async function updateAdminEmail(adminId: string, newEmail: string, currentPassword: string): Promise<void> {
  try {
    if (!newEmail || !currentPassword) {
      throw new ValidationError("Email and current password are required");
    }

    await connectDB();
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ValidationError("Admin not found");
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, admin.password);
    if (!isValidPassword) {
      throw new ValidationError("Current password is incorrect");
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: newEmail.toLowerCase().trim() });
    if (existingAdmin && existingAdmin._id.toString() !== adminId) {
      throw new ValidationError("Email already in use");
    }

    admin.email = newEmail.toLowerCase().trim();
    await admin.save();
    logger.log(`Admin ${adminId} updated email to ${newEmail}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error updating admin email:", error);
    throw new DatabaseError("Failed to update admin email");
  }
}

export async function updateAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    if (!currentPassword || !newPassword) {
      throw new ValidationError("Current password and new password are required");
    }

    if (newPassword.length < 8) {
      throw new ValidationError("New password must be at least 8 characters long");
    }

    await connectDB();
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ValidationError("Admin not found");
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, admin.password);
    if (!isValidPassword) {
      throw new ValidationError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    admin.password = hashedPassword;
    await admin.save();
    logger.log(`Admin ${adminId} updated password`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error updating admin password:", error);
    throw new DatabaseError("Failed to update admin password");
  }
}

export async function getAdminById(adminId: string): Promise<{ email: string } | null> {
  try {
    await connectDB();
    const admin = await Admin.findById(adminId);
    if (!admin) return null;

    return {
      email: admin.email,
    };
  } catch (error: unknown) {
    logger.error("Error fetching admin:", error);
    throw new DatabaseError("Failed to fetch admin");
  }
}

