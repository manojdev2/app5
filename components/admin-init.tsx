"use client";

import { useEffect } from "react";
import { ensureDefaultAdmin } from "@/lib/init-admin";

/**
 * Client component that triggers admin initialization on mount
 * This ensures the default admin is created when the app starts
 */
export default function AdminInit() {
  useEffect(() => {
    // Call the server action to ensure admin exists
    ensureDefaultAdmin().catch((error) => {
      console.error("Failed to initialize admin:", error);
    });
  }, []);

  return null; // This component doesn't render anything
}

