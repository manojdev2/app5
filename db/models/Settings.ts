"use strict";

import mongoose, { Schema, type Document } from "mongoose";

export interface SettingsDocument extends Document {
  seoTitle: string;
  seoDescription: string;
  navbarLogo: string;
  footerLogo: string;
  footerDescription: string;
  footerCopyright: string;
  updatedAt: Date;
  createdAt: Date;
}

const SettingsSchema = new Schema<SettingsDocument>(
  {
    seoTitle: {
      type: String,
      required: true,
      default: "Alto.trip - AI-Powered Travel Planning",
    },
    seoDescription: {
      type: String,
      required: true,
      default: "Plan your perfect trip with AI-powered travel planning. Get personalized itineraries, book hotels, and discover amazing destinations.",
    },
    navbarLogo: {
      type: String,
      default: "",
    },
    footerLogo: {
      type: String,
      default: "",
    },
    footerDescription: {
      type: String,
      default: "Your AI-powered travel companion for creating unforgettable journeys.",
    },
    footerCopyright: {
      type: String,
      default: "© 2025 Alto.trip. All rights reserved.",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SettingsSchema.index({}, { unique: true });

export const Settings = mongoose.models.Settings || mongoose.model<SettingsDocument>("Settings", SettingsSchema);

