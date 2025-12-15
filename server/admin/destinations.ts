"use strict";
"use server";

import connectDB from "@/db/mongodb";
import Destination from "@/db/models/Destination";
import { logger } from "@/lib/logger";
import { ValidationError, DatabaseError } from "@/lib/errors";

export interface DestinationData {
  _id: string;
  name: string;
  image: string;
  description: string;
  region: string;
  isLive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAllDestinations(): Promise<DestinationData[]> {
  try {
    await connectDB();
    const destinations = await Destination.find().sort({ region: 1, name: 1 });
    return destinations.map((dest) => ({
      _id: dest._id.toString(),
      name: dest.name,
      image: dest.image,
      description: dest.description,
      region: dest.region,
      isLive: dest.isLive,
      createdAt: dest.createdAt,
      updatedAt: dest.updatedAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching destinations:", error);
    throw new DatabaseError("Failed to fetch destinations");
  }
}

export async function getLiveDestinations(): Promise<DestinationData[]> {
  try {
    await connectDB();
    const destinations = await Destination.find({ isLive: true }).sort({ region: 1, name: 1 });
    return destinations.map((dest) => ({
      _id: dest._id.toString(),
      name: dest.name,
      image: dest.image,
      description: dest.description,
      region: dest.region,
      isLive: dest.isLive,
      createdAt: dest.createdAt,
      updatedAt: dest.updatedAt,
    }));
  } catch (error: unknown) {
    logger.error("Error fetching live destinations:", error);
    throw new DatabaseError("Failed to fetch live destinations");
  }
}

export async function createDestination(
  name: string,
  image: string,
  description: string,
  region: string
): Promise<DestinationData> {
  try {
    if (!name || !image || !description || !region) {
      throw new ValidationError("All fields are required");
    }

    await connectDB();
    const destination = new Destination({
      name: name.trim(),
      image: image.trim(),
      description: description.trim(),
      region: region.trim(),
      isLive: true,
    });

    const saved = await destination.save();
    logger.log(`Created destination: ${saved.name}`);

    return {
      _id: saved._id.toString(),
      name: saved.name,
      image: saved.image,
      description: saved.description,
      region: saved.region,
      isLive: saved.isLive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error creating destination:", error);
    throw new DatabaseError("Failed to create destination");
  }
}

export async function updateDestination(
  id: string,
  updates: {
    name?: string;
    image?: string;
    description?: string;
    region?: string;
    isLive?: boolean;
  }
): Promise<DestinationData> {
  try {
    await connectDB();
    const destination = await Destination.findById(id);
    if (!destination) {
      throw new ValidationError("Destination not found");
    }

    if (updates.name !== undefined) destination.name = updates.name.trim();
    if (updates.image !== undefined) destination.image = updates.image.trim();
    if (updates.description !== undefined) destination.description = updates.description.trim();
    if (updates.region !== undefined) destination.region = updates.region.trim();
    if (updates.isLive !== undefined) destination.isLive = updates.isLive;

    const saved = await destination.save();
    logger.log(`Updated destination: ${saved.name}`);

    return {
      _id: saved._id.toString(),
      name: saved.name,
      image: saved.image,
      description: saved.description,
      region: saved.region,
      isLive: saved.isLive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error updating destination:", error);
    throw new DatabaseError("Failed to update destination");
  }
}

export async function deleteDestination(id: string): Promise<void> {
  try {
    await connectDB();
    const destination = await Destination.findById(id);
    if (!destination) {
      throw new ValidationError("Destination not found");
    }

    await Destination.findByIdAndDelete(id);
    logger.log(`Deleted destination: ${destination.name}`);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Error deleting destination:", error);
    throw new DatabaseError("Failed to delete destination");
  }
}

