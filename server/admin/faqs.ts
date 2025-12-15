"use strict";
"use server";

import connectDB from "@/db/mongodb";
import FAQ from "@/db/models/FAQ";
import { logger } from "@/lib/logger";
import { ValidationError, DatabaseError } from "@/lib/errors";

export interface FAQData {
  _id: string;
  question: string;
  answer: string;
  isLive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAllFAQs(): Promise<FAQData[]> {
  try {
    await connectDB();
    const faqs = await FAQ.find().sort({ order: 1, createdAt: 1 });
    return faqs.map((faq) => ({
      _id: faq._id.toString(),
      question: faq.question,
      answer: faq.answer,
      isLive: faq.isLive,
      order: faq.order,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching FAQs:", error);
    throw new DatabaseError("Failed to fetch FAQs");
  }
}

export async function getLiveFAQs(): Promise<FAQData[]> {
  try {
    await connectDB();
    const faqs = await FAQ.find({ isLive: true }).sort({ order: 1, createdAt: 1 });
    return faqs.map((faq) => ({
      _id: faq._id.toString(),
      question: faq.question,
      answer: faq.answer,
      isLive: faq.isLive,
      order: faq.order,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching live FAQs:", error);
    throw new DatabaseError("Failed to fetch live FAQs");
  }
}

export async function createFAQ(question: string, answer: string, order?: number): Promise<FAQData> {
  try {
    if (!question || !answer) {
      throw new ValidationError("Question and answer are required");
    }

    await connectDB();

    // If order not provided, set to max order + 1
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrderFAQ = await FAQ.findOne().sort({ order: -1 });
      finalOrder = maxOrderFAQ ? maxOrderFAQ.order + 1 : 0;
    }

    const faq = new FAQ({
      question: question.trim(),
      answer: answer.trim(),
      isLive: true,
      order: finalOrder,
    });

    const saved = await faq.save();
    logger.log(`Created FAQ: ${saved.question.substring(0, 50)}...`);

    return {
      _id: saved._id.toString(),
      question: saved.question,
      answer: saved.answer,
      isLive: saved.isLive,
      order: saved.order,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error creating FAQ:", error);
    throw new DatabaseError("Failed to create FAQ");
  }
}

export async function updateFAQ(
  id: string,
  updates: {
    question?: string;
    answer?: string;
    isLive?: boolean;
    order?: number;
  }
): Promise<FAQData> {
  try {
    await connectDB();
    const faq = await FAQ.findById(id);
    if (!faq) {
      throw new ValidationError("FAQ not found");
    }

    if (updates.question !== undefined) faq.question = updates.question.trim();
    if (updates.answer !== undefined) faq.answer = updates.answer.trim();
    if (updates.isLive !== undefined) faq.isLive = updates.isLive;
    if (updates.order !== undefined) faq.order = updates.order;

    const saved = await faq.save();
    logger.log(`Updated FAQ: ${saved.question.substring(0, 50)}...`);

    return {
      _id: saved._id.toString(),
      question: saved.question,
      answer: saved.answer,
      isLive: saved.isLive,
      order: saved.order,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error updating FAQ:", error);
    throw new DatabaseError("Failed to update FAQ");
  }
}

export async function deleteFAQ(id: string): Promise<void> {
  try {
    await connectDB();
    const faq = await FAQ.findById(id);
    if (!faq) {
      throw new ValidationError("FAQ not found");
    }

    await FAQ.findByIdAndDelete(id);
    logger.log(`Deleted FAQ: ${faq.question.substring(0, 50)}...`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error deleting FAQ:", error);
    throw new DatabaseError("Failed to delete FAQ");
  }
}

