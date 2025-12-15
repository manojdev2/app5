"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { updateAdminEmail } from "@/server/admin/settings";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newEmail, currentPassword } = await request.json();

    if (!newEmail || !currentPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await updateAdminEmail(session, newEmail, currentPassword);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update email";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

