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

import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  try {
    console.log("=== Create Admin User ===\n");

    const email = await question("Enter admin email: ");
    if (!email || !email.includes("@")) {
      console.error("❌ Invalid email address");
      process.exit(1);
    }

    const password = await question("Enter admin password (min 8 characters): ");
    if (!password || password.length < 8) {
      console.error("❌ Password must be at least 8 characters long");
      process.exit(1);
    }

    const confirmPassword = await question("Confirm password: ");
    if (password !== confirmPassword) {
      console.error("❌ Passwords do not match");
      process.exit(1);
    }

    console.log("\nCreating admin user...");
    
    // Dynamic import AFTER dotenv is loaded
    const { default: connectDB } = await import("../db/mongodb");
    const { createInitialAdmin } = await import("../server/admin/auth");
    
    await connectDB();
    await createInitialAdmin(email, password);

    console.log("\n✅ Admin user created successfully!");
    console.log(`Email: ${email}`);
    console.log("\n⚠️  Remember to set ADMIN_ENABLED=true in your .env file to enable admin features.");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("\n❌ Failed to create admin user:", errorMessage);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

