"use strict";
"use server";

import { z } from "zod";
import { formSchema } from "./schemas";
import { logger } from "@/lib/logger";
import { extractDestinationInfo } from "./helpers";
import {
  validateUserAndCredits,
  callOpenAIService,
  fetchAdditionalData,
  savePlanToDatabase,
  handleErrorAndRefund,
} from "./ai-helpers";
import {
  validateFormData,
  validateDatesAndCalculateDuration,
  buildAIPrompt,
  parseAIResponse,
} from "./helpers";

/**
 * Generate destination image from Unsplash
 */
async function generateDestinationImage(destination: string, destinationCountry?: string): Promise<string | null> {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      logger.error("Unsplash API key not found");
      return null;
    }

    const baseQuery = destinationCountry 
      ? `${destination} ${destinationCountry}` 
      : destination;
    
    const searchQueries = [
      `${baseQuery} travel vacation`,
      `${baseQuery} tourism landmark`,
      `${baseQuery} cityscape landscape`,
      `${baseQuery} travel destination`,
      baseQuery,
    ];

    logger.log("Fetching destination image from Unsplash for:", baseQuery);

    for (const searchQuery of searchQueries) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=10&client_id=${accessKey}`
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const travelImages = data.results.filter((result: any) => {
            const tags = result.tags?.map((tag: any) => tag.title?.toLowerCase() || '').join(' ') || '';
            const description = (result.description || result.alt_description || '').toLowerCase();
            const combined = `${tags} ${description}`;
            
            const travelTerms = ['travel', 'tourism', 'vacation', 'landmark', 'city', 'landscape', 'architecture', 'monument', 'beach', 'nature', 'scenic', 'view'];
            const hasTravelTerms = travelTerms.some(term => combined.includes(term));
            
            const avoidTerms = ['portrait', 'person', 'people', 'face', 'man', 'woman', 'guy', 'girl', 'boy'];
            const hasAvoidTerms = avoidTerms.some(term => combined.includes(term));
            
            return hasTravelTerms && !hasAvoidTerms;
          });
          
          const selectedImage = travelImages.length > 0 ? travelImages[0] : data.results[0];
          
          if (selectedImage && selectedImage.urls) {
            const imageUrl = selectedImage.urls.regular || selectedImage.urls.full;
            logger.log("Successfully fetched destination image from Unsplash:", searchQuery);
            return imageUrl;
          }
        }
      } catch (error) {
        logger.error(`Error with search query "${searchQuery}":`, error);
        continue;
      }
    }

    logger.error("No suitable travel image found in Unsplash");
    return null;
  } catch (error) {
    logger.error("Error fetching destination image from Unsplash:", error);
    return null;
  }
}

/**
 * Main function to generate trip plan
 * Refactored into smaller functions per CodeCanyon requirements (<100 lines each)
 */
export async function generateTripPlan(formData: z.infer<typeof formSchema>): Promise<string | { error: string }> {
  let creditsDeducted = false;
  const CREDITS_PER_PLAN = 100;
  
  try {
    logger.log("=== GENERATE TRIP PLAN CALLED ===");
    logger.log("Received form data in server action:", JSON.stringify(formData, null, 2));

    // Step 1: Validate user and credits
    const { user, creditsDeducted: deducted } = await validateUserAndCredits();
    creditsDeducted = deducted;

    // Step 2: Validate form data
    const validatedData = validateFormData(formData);

    // Step 3: Validate dates and calculate duration
    const { startDateObj, endDateObj, days, itineraryDates } = validateDatesAndCalculateDuration(
      validatedData.startDate,
      validatedData.endDate
    );

    // Step 4: Build AI prompt
    const prompt = buildAIPrompt(validatedData, startDateObj, endDateObj, days, itineraryDates);

    // Step 5: Call OpenAI service
    const openAIResponse = await callOpenAIService(prompt, days);

   

    // Step 6: Parse AI response
    const aiPlanData = parseAIResponse(openAIResponse, days);

    // Step 7: Extract destination info
    const { city: destinationCity, country: destinationCountry } = extractDestinationInfo(validatedData.destination);
    logger.log("Extracted destination:", { 
      original: validatedData.destination, 
      city: destinationCity, 
      country: destinationCountry 
    });
    
    // Step 8: Generate destination image
    let destinationImage = null;
    if (destinationCity || validatedData.destination) {
      try {
        destinationImage = await generateDestinationImage(
          destinationCity || validatedData.destination || "",
          destinationCountry
        );
      } catch (error) {
        logger.error("Error generating destination image:", error);
      }
    }

    // Step 9: Fetch additional data (weather, places, hotels)
    const { weatherData, placesData, destinationLat, destinationLng } = await fetchAdditionalData(
      destinationCity,
      destinationCountry,
      startDateObj,
      endDateObj,
      validatedData.adults || 1,
      validatedData.children || 0
    );

    // Step 10: Save plan to database
    const planId = await savePlanToDatabase(
      aiPlanData,
      user,
      validatedData,
      startDateObj,
      endDateObj,
      destinationCity,
      destinationCountry,
      destinationLat,
      destinationLng,
      destinationImage,
      weatherData,
      placesData
    );

    logger.log(`✅ Plan generation completed. Credits deducted: ${CREDITS_PER_PLAN}`);
    return planId;
  } catch (error: unknown) {
    logger.error("=== ERROR IN GENERATE TRIP PLAN ===");
    logger.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    logger.error("Error name:", error instanceof Error ? error.name : "Unknown");
    logger.error("Error message:", error instanceof Error ? error.message : String(error));
    logger.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return await handleErrorAndRefund(error, creditsDeducted);
  }
}
