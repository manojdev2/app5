"use strict";

import { NextResponse } from "next/server";
import { cleanupOrphanedUsers } from "@/server/admin/users";

export async function POST() {
  try {
    const result = await cleanupOrphanedUsers();
    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      total: result.total,
      message: `Cleaned up ${result.deleted} orphaned user(s) out of ${result.total} total users`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to cleanup users";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

