"use strict";

import mongoose, { Schema, Document } from "mongoose";

export interface IPageContent extends Document {
  pageSlug: string; // 'about', 'contact', 'terms', 'privacy'
  title: string;
  content: string; // HTML or markdown content
  metadata?: {
    lastUpdated?: Date;
    [key: string]: unknown;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const PageContentSchema = new Schema<IPageContent>(
  {
    pageSlug: {
      type: String,
      required: true,
      unique: true,
      enum: ["about", "contact", "terms", "privacy"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const PageContent = mongoose.models.PageContent || mongoose.model<IPageContent>("PageContent", PageContentSchema);

export default PageContent;

