"use strict";
"use server";

import connectDB from "@/db/mongodb";
import { LandingPage, type LandingPageSection } from "@/db/models/LandingPage";
import { logger } from "@/lib/logger";

export interface PublicLandingPageData {
  section: LandingPageSection;
  heading: string;
  description: string;
  content: Record<string, unknown>;
  images?: Array<{ field: string; url: string }>;
  jsonFiles?: Array<{ field: string; url: string }>;
}

export async function getPublicLandingPage(section: LandingPageSection): Promise<PublicLandingPageData | null> {
  try {
    await connectDB();
    const page = await LandingPage.findOne({ section }).lean() as any;
    if (!page) return null;
    
    return {
      section: page.section as LandingPageSection,
      heading: page.heading,
      description: page.description,
      content: page.content || {},
      images: page.images || [],
      jsonFiles: page.jsonFiles || [],
    };
  } catch (error) {
    logger.error("Failed to fetch public landing page", { error, section });
    return null;
  }
}

export async function getAllPublicLandingPages(): Promise<PublicLandingPageData[]> {
  try {
    await connectDB();
    const pages = await LandingPage.find({}).sort({ section: 1 }).lean();
    return pages.map((page: any) => ({
      section: page.section as LandingPageSection,
      heading: page.heading,
      description: page.description,
      content: page.content || {},
      images: page.images || [],
      jsonFiles: page.jsonFiles || [],
    }));
  } catch (error) {
    logger.error("Failed to fetch public landing pages", { error });
    return [];
  }
}

