"use strict";

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const field = formData.get("field") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!field) {
      return NextResponse.json({ error: "No field provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      return NextResponse.json({ error: "File must be a JSON file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "json");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${field}-${timestamp}.json`;
    const filepath = join(uploadsDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    // Return public URL
    const url = `/uploads/json/${filename}`;
    return NextResponse.json({ url, field });
  } catch (error) {
    console.error("Error uploading JSON file:", error);
    return NextResponse.json(
      { error: "Failed to upload JSON file" },
      { status: 500 }
    );
  }
}

