"use strict";
"use server";

import connectDB from "@/db/mongodb";
import { Settings } from "@/db/models/Settings";
import { logger } from "@/lib/logger";

export interface SiteSettingsData {
  seoTitle: string;
  seoDescription: string;
  navbarLogo: string;
  footerLogo: string;
  footerDescription: string;
  footerCopyright: string;
}

export async function getSiteSettings(): Promise<SiteSettingsData | null> {
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
    logger.error("Failed to fetch site settings", { error });
    return null;
  }
}

export async function updateSiteSettings(data: Partial<SiteSettingsData>): Promise<boolean> {
  try {
    await connectDB();
    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings({
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        navbarLogo: data.navbarLogo || "",
        footerLogo: data.footerLogo || "",
        footerDescription: data.footerDescription || "",
        footerCopyright: data.footerCopyright || "",
      });
    } else {
      // Update existing settings
      if (data.seoTitle !== undefined) settings.seoTitle = data.seoTitle;
      if (data.seoDescription !== undefined) settings.seoDescription = data.seoDescription;
      if (data.navbarLogo !== undefined) settings.navbarLogo = data.navbarLogo;
      if (data.footerLogo !== undefined) settings.footerLogo = data.footerLogo;
      if (data.footerDescription !== undefined) settings.footerDescription = data.footerDescription;
      if (data.footerCopyright !== undefined) settings.footerCopyright = data.footerCopyright;
    }

    await settings.save();
    return true;
  } catch (error) {
    logger.error("Failed to update site settings", { error });
    return false;
  }
}

