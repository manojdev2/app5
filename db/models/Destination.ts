"use strict";

import mongoose, { Schema, Document } from "mongoose";

export interface IDestination extends Document {
  name: string;
  image: string; // Path to image in /public folder
  description: string;
  region: string;
  isLive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const DestinationSchema = new Schema<IDestination>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Destination = mongoose.models.Destination || mongoose.model<IDestination>("Destination", DestinationSchema);

export default Destination;

