"use strict";
"use server";

import { z } from "zod";
import { formSchema } from "./schemas";
import { logger } from "@/lib/logger";
import { AuthenticationError, InsufficientCreditsError, ValidationError, AIServiceError } from "@/lib/errors";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserCredits, deductCredits, addCredits } from "./credits";
import {
  validateFormData,
  validateDatesAndCalculateDuration,
  buildAIPrompt,
  calculateMaxTokens,
  parseAIResponse,
  extractDestinationInfo,
} from "./helpers";

const CREDITS_PER_PLAN = 100;

/**
 * Validate user authentication and credits
 * Returns user object and credits deducted flag
 */
export async function validateUserAndCredits(): Promise<{ user: any; creditsDeducted: boolean }> {
  logger.log("🚀 generateTripPlan called");
  
  const user = await currentUser();
  if (!user) {
    throw new AuthenticationError();
  }

  const credits = await getUserCredits();
  
  if (credits < CREDITS_PER_PLAN) {
    throw new InsufficientCreditsError(CREDITS_PER_PLAN, credits);
  }

  const deducted = await deductCredits(CREDITS_PER_PLAN);
  if (!deducted) {
    const currentCredits = await getUserCredits();
    if (currentCredits < CREDITS_PER_PLAN) {
      throw new InsufficientCreditsError(CREDITS_PER_PLAN, currentCredits);
    }
    throw new ValidationError("Failed to deduct credits. Please try again.");
  }

  const remainingCredits = credits - CREDITS_PER_PLAN;
  logger.log(`✅ Deducted ${CREDITS_PER_PLAN} credits. Remaining: ${remainingCredits}`);

  return { user, creditsDeducted: true };
}

/**
 * Call OpenAI API to generate trip plan
 */
export async function callOpenAIService(prompt: string, days: number): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIServiceError("OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.");
  }

  const maxTokens = calculateMaxTokens(days);
  logger.log("Calling OpenAI API...", { promptLength: prompt.length, maxTokens, days });



const genAI = new GoogleGenerativeAI("AIzaSyCfVfCcJW1ztXCjQaY225FUYF8M5e7UN1s");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp", // choose gemini model
});

const response = await model.generateContent({
  systemInstruction: `
    You are an expert travel planner with extensive knowledge of destinations worldwide.
    You create detailed, realistic, and personalized travel itineraries.
    Always respond with valid JSON only - no markdown, no code blocks, no explanations.
    Just pure JSON matching the exact structure requested.
    IMPORTANT: Always include ALL sections:
    tripHighlights, itinerary must include each day with morning, afternoon, and evening broken into specific times like “07:00 AM”, “10:30 AM”, “03:00 PM”, etc., bestTimeToVisit, and packingSuggestions.
    Do not truncate any section.
  `,
  contents: [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ],
  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: maxTokens,
    responseMimeType: "application/json", // ensures JSON output
  },
});

const result = response.response.text(); // JSON string returned


 logger.log("OpenAI API response status:", result);

  /*if (!response.ok) {
    const errorText = await response.text();
    logger.error("OpenAI API error response:", errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    if (response.status === 429) {
      const quotaError = errorData?.error?.code === "insufficient_quota" || 
                        errorText.includes("quota") || 
                        errorText.includes("insufficient_quota");
      if (quotaError) {
        throw new AIServiceError("OpenAI API quota exceeded. Please check your OpenAI account billing and quota limits.");
      }
      throw new AIServiceError("Rate limit exceeded. Please try again in a few moments.");
    }
    
    const errorMessage = errorData?.error?.message || errorData?.message || errorText || "Unknown error";
    throw new AIServiceError(`OpenAI API error: ${errorMessage}`);
  } */

  return await response.response.text();
}


/**
 * Fetch additional data (weather, places, hotels, coordinates)
 */
export async function fetchAdditionalData(
  destinationCity: string,
  destinationCountry: string,
  startDateObj: Date | null,
  endDateObj: Date | null,
  adults: number,
  children: number
): Promise<{
  weatherData: any;
  placesData: any;
  destinationLat?: number;
  destinationLng?: number;
}> {
  const { getWeatherData } = await import("./weather");
  const { getPlacesData } = await import("./places");
  const { searchHotels } = await import("./hotel-search");

  let weatherData = null;
  let placesData = null;
  let destinationLat: number | undefined;
  let destinationLng: number | undefined;

  if (!destinationCity) {
    logger.warn("Warning: No destination city found, skipping weather and places data");
    return { weatherData: null, placesData: null };
  }

  try {
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (mapsApiKey) {
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          destinationCountry ? `${destinationCity},${destinationCountry}` : destinationCity
        )}&key=${mapsApiKey}`
      );
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.results && geocodeData.results.length > 0) {
          destinationLat = geocodeData.results[0].geometry.location.lat;
          destinationLng = geocodeData.results[0].geometry.location.lng;
        }
      }
    }

    const [weatherDataResult, placesDataResult, hotelSearchDataResult] = await Promise.allSettled([
      getWeatherData(destinationCity, destinationCountry, startDateObj || undefined, endDateObj || undefined),
      getPlacesData(destinationCity, destinationCountry),
      searchHotels({
        destination: destinationCity,
        checkIn: startDateObj || undefined,
        checkOut: endDateObj || undefined,
        adults: adults || 2,
        children: children || 0,
        rooms: 1,
        sortBy: 'price',
      }).catch(() => null),
    ]);

    weatherData = weatherDataResult.status === 'fulfilled' ? weatherDataResult.value : null;
    placesData = placesDataResult.status === 'fulfilled' ? placesDataResult.value : null;
    const hotelSearchData = hotelSearchDataResult.status === 'fulfilled' ? hotelSearchDataResult.value : null;

    logger.log("Weather data fetched:", weatherData ? "Success" : "Failed");

    if (hotelSearchData && hotelSearchData.length > 0 && placesData?.hotels) {
      placesData.hotels = placesData.hotels.map((hotel: any) => {
        const matchedHotel = hotelSearchData.find(
          (h: any) => h.name.toLowerCase().includes(hotel.name.toLowerCase()) ||
                     hotel.name.toLowerCase().includes(h.name.toLowerCase())
        );
        return {
          ...hotel,
          price: matchedHotel?.price,
          priceCurrency: matchedHotel?.priceCurrency,
          stars: matchedHotel?.stars || (hotel.rating !== undefined ? Math.round(hotel.rating) : undefined),
        };
      });
    }
  } catch (error) {
    logger.error("Error fetching real data:", error);
  }

  return { weatherData, placesData, destinationLat, destinationLng };
}

/**
 * Save plan to database
 */
export async function savePlanToDatabase(
  aiPlanData: any,
  user: any,
  validatedData: z.infer<typeof formSchema>,
  startDateObj: Date,
  endDateObj: Date,
  destinationCity: string,
  destinationCountry: string,
  destinationLat: number | undefined,
  destinationLng: number | undefined,
  destinationImage: string | null,
  weatherData: any,
  placesData: any
): Promise<string> {
  const { default: connectDB } = await import("@/db/mongodb");
  const { default: Plan } = await import("@/db/models/Plan");
  const { DatabaseError } = await import("@/lib/errors");

  await connectDB();

  const finalCurrency = validatedData.currency || "INR";

  logger.log("Saving plan with:", {
    destination: destinationCity,
    destinationCountry,
    currency: finalCurrency,
    budget: validatedData.budget,
    hasWeatherData: !!weatherData,
    hasPlacesData: !!placesData,
  });

  const plan = new Plan({
    text: JSON.stringify(aiPlanData),
    userId: user?.id,
    budget: validatedData.budget || 0,
    startDate: startDateObj,
    endDate: endDateObj,
    destination: destinationCity,
    destinationCountry: destinationCountry || undefined,
    destinationLat,
    destinationLng,
    destinationImage: destinationImage || undefined,
    currency: finalCurrency,
    weatherData: weatherData || undefined,
    placesData: placesData || undefined,
  });

  const savedPlan = await plan.save();

  const planId = String(savedPlan._id || (savedPlan as any).id);
  if (!planId || planId === 'undefined') {
    throw new DatabaseError("Failed to save plan - no ID returned");
  }

  logger.log("Plan saved successfully with ID:", planId);
  return planId;
}

/**
 * Handle error and refund credits if needed
 */
export async function handleErrorAndRefund(error: unknown, creditsDeducted: boolean): Promise<{ error: string }> {
  const CREDITS_PER_PLAN = 100;
  
  if (creditsDeducted) {
    try {
      logger.log(`🔄 Attempting to refund ${CREDITS_PER_PLAN} credits due to plan generation failure...`);
      const refunded = await addCredits(CREDITS_PER_PLAN);
      if (refunded) {
        logger.log(`✅ Successfully refunded ${CREDITS_PER_PLAN} credits`);
      } else {
        logger.error(`❌ Failed to refund ${CREDITS_PER_PLAN} credits - manual intervention may be required`);
      }
    } catch (refundError) {
      logger.error("Error refunding credits:", refundError);
    }
  }

  let errorMessage = "Failed to generate trip plan. Please try again.";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  logger.error("Returning error to client:", errorMessage);
  
  return { error: errorMessage };
}

