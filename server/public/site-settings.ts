"use strict";
"use server";

import connectDB from "@/db/mongodb";
import { Settings } from "@/db/models/Settings";
import { logger } from "@/lib/logger";

export interface PublicSiteSettingsData {
  seoTitle: string;
  seoDescription: string;
  navbarLogo: string;
  footerLogo: string;
  footerDescription: string;
  footerCopyright: string;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettingsData | null> {
  try {
    await connectDB();
    const settings = await Settings.findOne().lean() as any;

    if (!settings) {
      return null;
    }

    return {
      seoTitle: settings.seoTitle || "",
      seoDescription: settings.seoDescription || "",
      navbarLogo: settings.navbarLogo || "",
      footerLogo: settings.footerLogo || "",
      footerDescription: settings.footerDescription || "",
      footerCopyright: settings.footerCopyright || "",
    };
  } catch (error) {
    logger.error("Failed to fetch public site settings", { error });
    return null;
  }
}

