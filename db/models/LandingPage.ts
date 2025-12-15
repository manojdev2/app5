"use strict";

import mongoose, { Schema, type Document } from "mongoose";

export type LandingPageSection = "whyChoose" | "featuredExplorations" | "chooseDestination" | "contactAdventure";

export interface LandingPageDocument extends Document {
  section: LandingPageSection;
  heading: string;
  description: string;
  content: Record<string, unknown>; // Flexible content structure for each section
  images?: Array<{ field: string; url: string }>; // For image uploads
  jsonFiles?: Array<{ field: string; url: string }>; // For JSON animation files
  updatedAt: Date;
  createdAt: Date;
}

const LandingPageSchema = new Schema<LandingPageDocument>(
  {
    section: {
      type: String,
      required: true,
      enum: ["whyChoose", "featuredExplorations", "chooseDestination", "contactAdventure"],
    },
    heading: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    content: {
      type: Schema.Types.Mixed,
      default: {},
    },
    images: [
      {
        field: String,
        url: String,
      },
    ],
    jsonFiles: [
      {
        field: String,
        url: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure only one document per section
LandingPageSchema.index({ section: 1 }, { unique: true });

export const LandingPage = mongoose.models.LandingPage || mongoose.model<LandingPageDocument>("LandingPage", LandingPageSchema);

