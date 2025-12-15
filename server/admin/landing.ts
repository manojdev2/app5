"use strict";
"use server";

import connectDB from "@/db/mongodb";
import { LandingPage, type LandingPageDocument, type LandingPageSection } from "@/db/models/LandingPage";
import { requireAdmin } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

export type { LandingPageSection };

export interface LandingPageData {
  _id: string;
  section: LandingPageSection;
  heading: string;
  description: string;
  content: Record<string, unknown>;
  images?: Array<{ field: string; url: string }>;
  jsonFiles?: Array<{ field: string; url: string }>;
  updatedAt: Date;
  createdAt: Date;
}

export async function getAllLandingPages(): Promise<LandingPageData[]> {
  await requireAdmin();
  
  try {
    await connectDB();
    const pages = await LandingPage.find({}).sort({ section: 1 }).lean();
    return pages.map((page: any) => ({
      _id: page._id?.toString() || "",
      section: page.section as LandingPageSection,
      heading: page.heading,
      description: page.description,
      content: page.content || {},
      images: page.images || [],
      jsonFiles: page.jsonFiles || [],
      updatedAt: page.updatedAt,
      createdAt: page.createdAt,
    }));
  } catch (error) {
    logger.error("Failed to fetch landing pages", { error });
    throw new Error("Failed to fetch landing pages");
  }
}

export async function getLandingPageBySection(section: LandingPageSection): Promise<LandingPageData | null> {
  await requireAdmin();
  
  try {
    await connectDB();
    const page = await LandingPage.findOne({ section }).lean() as any;
    if (!page) return null;
    
    return {
      _id: page._id?.toString() || "",
      section: page.section as LandingPageSection,
      heading: page.heading,
      description: page.description,
      content: page.content || {},
      images: page.images || [],
      jsonFiles: page.jsonFiles || [],
      updatedAt: page.updatedAt,
      createdAt: page.createdAt,
    };
  } catch (error) {
    logger.error("Failed to fetch landing page", { error, section });
    throw new Error("Failed to fetch landing page");
  }
}

export async function updateLandingPage(
  section: LandingPageSection,
  data: {
    heading: string;
    description: string;
    content: Record<string, unknown>;
    images?: Array<{ field: string; url: string }>;
    jsonFiles?: Array<{ field: string; url: string }>;
  }
): Promise<LandingPageData> {
  await requireAdmin();
  
  try {
    await connectDB();
    const page = await LandingPage.findOneAndUpdate(
      { section },
      {
        heading: data.heading,
        description: data.description,
        content: data.content,
        images: data.images || [],
        jsonFiles: data.jsonFiles || [],
      },
      { upsert: true, new: true }
    ).lean() as any;
    
    return {
      _id: page._id?.toString() || "",
      section: page.section as LandingPageSection,
      heading: page.heading,
      description: page.description,
      content: page.content || {},
      images: page.images || [],
      jsonFiles: page.jsonFiles || [],
      updatedAt: page.updatedAt,
      createdAt: page.createdAt,
    };
  } catch (error) {
    logger.error("Failed to update landing page", { error, section });
    throw new Error("Failed to update landing page");
  }
}

