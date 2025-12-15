"use strict";

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    return NextResponse.json({ authenticated: !!session });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

