"use strict";

import { NextResponse } from "next/server";
import { deleteAdminSession } from "@/lib/admin-auth";

export async function POST() {
  try {
    await deleteAdminSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

