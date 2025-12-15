import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlan extends Document {
  text: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  userId?: string;
  destination?: string;
  destinationCountry?: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationImage?: string;
  currency?: string;
  weatherData?: {
    temperature: { current: number; min: number; max: number };
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
    forecast?: Array<{
      date: string;
      temp: { min: number; max: number };
      description: string;
      icon: string;
    }>;
  };
  placesData?: {
    attractions: Array<{
      placeId: string;
      name: string;
      address: string;
      rating?: number;
      photoUrl?: string;
    }>;
    restaurants: Array<{
      placeId: string;
      name: string;
      address: string;
      rating?: number;
      photoUrl?: string;
    }>;
    hotels: Array<{
      placeId: string;
      name: string;
      address: string;
      rating?: number;
      photoUrl?: string;
    }>;
  };
  createdAt: Date;
}

const PlanSchema: Schema = new Schema<IPlan>(
  {
    text: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    userId: {
      type: String,
      required: false,
    },
    destination: {
      type: String,
      required: false,
    },
    destinationCountry: {
      type: String,
      required: false,
    },
    destinationLat: {
      type: Number,
      required: false,
    },
    destinationLng: {
      type: Number,
      required: false,
    },
    destinationImage: {
      type: String,
      required: false,
    },
    currency: {
      type: String,
      required: false,
    },
    weatherData: {
      type: Schema.Types.Mixed,
      required: false,
    },
    placesData: {
      type: Schema.Types.Mixed,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;

