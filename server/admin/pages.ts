"use strict";
"use server";

import connectDB from "@/db/mongodb";
import PageContent from "@/db/models/PageContent";
import { logger } from "@/lib/logger";
import { ValidationError, DatabaseError } from "@/lib/errors";

export type PageSlug = "about" | "contact" | "terms" | "privacy";

export interface PageContentData {
  _id: string;
  pageSlug: PageSlug;
  title: string;
  content: string;
  metadata?: {
    lastUpdated?: Date;
    [key: string]: unknown;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAllPages(): Promise<PageContentData[]> {
  try {
    await connectDB();
    const pages = await PageContent.find().sort({ pageSlug: 1 });
    return pages.map((page) => ({
      _id: page._id.toString(),
      pageSlug: page.pageSlug as PageSlug,
      title: page.title,
      content: page.content,
      metadata: page.metadata,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching pages:", error);
    throw new DatabaseError("Failed to fetch pages");
  }
}

export async function getPageBySlug(pageSlug: PageSlug): Promise<PageContentData | null> {
  try {
    await connectDB();
    const page = await PageContent.findOne({ pageSlug });
    if (!page) return null;

    return {
      _id: page._id.toString(),
      pageSlug: page.pageSlug as PageSlug,
      title: page.title,
      content: page.content,
      metadata: page.metadata,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  } catch (error: unknown) {
    logger.error("Error fetching page:", error);
    throw new DatabaseError("Failed to fetch page");
  }
}

export async function createPage(
  pageSlug: PageSlug,
  title: string,
  content: string
): Promise<PageContentData> {
  try {
    if (!title || !content) {
      throw new ValidationError("Title and content are required");
    }

    await connectDB();

    // Check if page already exists
    const existing = await PageContent.findOne({ pageSlug });
    if (existing) {
      throw new ValidationError(`Page with slug ${pageSlug} already exists`);
    }

    const page = new PageContent({
      pageSlug,
      title: title.trim(),
      content: content.trim(),
      metadata: {
        lastUpdated: new Date(),
      },
    });

    const saved = await page.save();
    logger.log(`Created page: ${saved.pageSlug}`);

    return {
      _id: saved._id.toString(),
      pageSlug: saved.pageSlug as PageSlug,
      title: saved.title,
      content: saved.content,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error creating page:", error);
    throw new DatabaseError("Failed to create page");
  }
}

export async function updatePage(
  id: string,
  updates: {
    title?: string;
    content?: string;
  }
): Promise<PageContentData> {
  try {
    await connectDB();
    const page = await PageContent.findById(id);
    if (!page) {
      throw new ValidationError("Page not found");
    }

    if (updates.title !== undefined) page.title = updates.title.trim();
    if (updates.content !== undefined) page.content = updates.content.trim();

    // Update metadata
    page.metadata = {
      ...page.metadata,
      lastUpdated: new Date(),
    };

    const saved = await page.save();
    logger.log(`Updated page: ${saved.pageSlug}`);

    return {
      _id: saved._id.toString(),
      pageSlug: saved.pageSlug as PageSlug,
      title: saved.title,
      content: saved.content,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error updating page:", error);
    throw new DatabaseError("Failed to update page");
  }
}

