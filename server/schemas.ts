"use strict";

import { z } from "zod";

// Helper to handle date conversion (can be Date object or ISO string)
const dateSchema = z.union([
  z.date(),
  z.string().transform((str) => new Date(str)),
]);

export const formSchema = z.object({
  startCity: z.string().min(1, "Start city is required"),
  destination: z.string().min(1, "Destination is required"),
  startDate: dateSchema,
  endDate: dateSchema,
  travelThemes: z.array(z.string()).optional(),
  travelPace: z.string().optional(),
  weather: z.string().optional(),
  accommodation: z.string().optional(),
  food: z.string().optional(),
  transport: z.string().optional(),
  currency: z.string().optional(),
  budget: z.number().min(0).optional(),
  passengers: z.string().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  infants: z.number().optional(),
  additionalPreferences: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
    const end = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
    return end >= start;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
    const end = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
    // Calculate days including both start and end dates
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days <= 20;
  }
  return true;
}, {
  message: "Maximum trip duration is 20 days. Please select dates within 20 days.",
  path: ["endDate"],
});
