"use strict";

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminById } from "@/server/admin/settings";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await getAdminById(session);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch {
    return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 });
  }
}

