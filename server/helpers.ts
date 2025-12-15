"use strict";

import { z } from "zod";
import { formSchema } from "./schemas";
import { logger } from "@/lib/logger";
import { ValidationError } from "@/lib/errors";

const MAX_TRIP_DAYS = 20;

/**
 * Helper functions for date manipulation and validation
 * Moved from nested functions to module level per CodeCanyon requirements
 */

/**
 * Normalize date to UTC midnight (prevents timezone issues)
 * This preserves the DATE the user selected, regardless of timezone
 */
export function normalizeToUTCMidnight(date: Date | string): Date {
  let dateStr: string;
  
  if (date instanceof Date) {
    // If it's a Date object, extract date components from local timezone
    // This preserves the date the user saw/selected
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  } else {
    // If it's already a string, use it directly
    dateStr = date;
  }
  
  // Check if it's a date-only string (YYYY-MM-DD) - this is what we send from client
  const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1; // Month is 0-indexed
    const day = parseInt(dateOnlyMatch[3], 10);
    // Create date at UTC midnight using the extracted date components
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  
  // If it's an ISO string with time, extract just the date part
  const isoDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const year = parseInt(isoDateMatch[1], 10);
    const month = parseInt(isoDateMatch[2], 10) - 1; // Month is 0-indexed
    const day = parseInt(isoDateMatch[3], 10);
    // Create date at UTC midnight using the extracted date components
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  
  // Fallback: try to parse as Date and extract local date components
  const d = new Date(dateStr);
  // Use local date components to preserve the date the user saw
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  // Create date at UTC midnight
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Format date in UTC (avoids timezone issues)
 */
export function formatDateUTC(date: Date): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  const year = date.getUTCFullYear();
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  return `${month} ${day}, ${year}`;
}

/**
 * Calculate itinerary dates array
 */
export function calculateItineraryDates(startDate: Date, endDate: Date): string[] {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const itineraryDates: string[] = [];
  
  for (let i = 0; i < days; i++) {
    // Use UTC methods to add days and format consistently
    const dayDate = new Date(startDate);
    dayDate.setUTCDate(dayDate.getUTCDate() + i);
    // Format using UTC date components to ensure consistent date string
    const year = dayDate.getUTCFullYear();
    const month = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dayDate.getUTCDate()).padStart(2, '0');
    itineraryDates.push(`${year}-${month}-${day}`);
  }
  
  return itineraryDates;
}

/**
 * Extract destination city and country from destination string
 */
export function extractDestinationInfo(destination: string): { city: string; country: string } {
  let destinationCity = destination || "";
  let destinationCountry = "";
  
  if (destination) {
    // Clean the destination string
    const cleanDestination = destination.trim();
    
    // Check if it contains a comma (format: "City, Country" or "City, Country Code")
    if (cleanDestination.includes(",")) {
      const parts = cleanDestination.split(",").map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length > 0) {
        destinationCity = parts[0];
        // If there are more parts, join them as country (could be "Country" or "Country Code")
        if (parts.length > 1) {
          const countryPart = parts.slice(1).join(", ");
          
          // Check if it's a country code (2-3 letters) - try to get country name
          // Country codes are usually 2-3 uppercase letters
          if (countryPart.length <= 3 && /^[A-Z]+$/.test(countryPart)) {
            // It's a country code, use it as-is since geocoding APIs can handle country codes
            destinationCountry = countryPart;
          } else {
            // It's already a country name
            destinationCountry = countryPart;
          }
        }
      }
    } else {
      // No comma, treat the whole string as city
      destinationCity = cleanDestination;
    }
  }
  
  return { city: destinationCity, country: destinationCountry };
}

/**
 * Validate and parse form data
 */
export function validateFormData(formData: unknown): z.infer<typeof formSchema> {
  try {
    return formSchema.parse(formData);
  } catch (validationError: unknown) {
    logger.error("Form validation error:", validationError);
    throw new ValidationError("Invalid form data. Please check all required fields and try again.", {
      validationError: validationError instanceof Error ? validationError.message : String(validationError)
    });
  }
}

/**
 * Validate dates and calculate trip duration
 */
export function validateDatesAndCalculateDuration(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): { startDateObj: Date; endDateObj: Date; days: number; itineraryDates: string[] } {
  const startDateObj = startDate ? normalizeToUTCMidnight(startDate) : null;
  const endDateObj = endDate ? normalizeToUTCMidnight(endDate) : null;

  if (!startDateObj || !endDateObj) {
    throw new ValidationError("Start date and end date are required.");
  }

  const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (days <= 0) {
    throw new ValidationError("Invalid date range. End date must be after start date.");
  }

  if (days > MAX_TRIP_DAYS) {
    throw new ValidationError(
      `Maximum trip duration is ${MAX_TRIP_DAYS} days. Please select dates within ${MAX_TRIP_DAYS} days. Your selected trip duration is ${days} days.`
    );
  }

  const itineraryDates = calculateItineraryDates(startDateObj, endDateObj);

  logger.log("Trip duration calculated:", days, "days");

  return { startDateObj, endDateObj, days, itineraryDates };
}

/**
 * Build AI prompt for trip planning
 */
export function buildAIPrompt(
  validatedData: z.infer<typeof formSchema>,
  startDateObj: Date,
  endDateObj: Date,
  days: number,
  itineraryDates: string[]
): string {
  const {
    startCity,
    destination,
    travelThemes,
    travelPace,
    weather,
    accommodation,
    food,
    transport,
    currency,
    budget,
    passengers,
    adults,
    children,
    infants,
    additionalPreferences,
  } = validatedData;

  logger.log("Extracted values:", {
    startCity,
    destination,
    startDate: startDateObj.toISOString(),
    endDate: endDateObj.toISOString(),
    travelThemes,
    travelPace,
    currency,
    budget,
  });

  const prompt = `You are an expert travel planner with deep knowledge of destinations worldwide. Create a detailed, personalized travel itinerary that matches the exact frontend structure provided below.

**USER TRIP DETAILS:**
- Starting Location: ${startCity || "Not specified"}
- Destination: ${destination || "Not specified"}
- Travel Start Date: ${formatDateUTC(startDateObj)}
- Travel End Date: ${formatDateUTC(endDateObj)}
- Trip Duration: ${days} days
- Currency Type: ${currency || "INR"} (use this currency for all price references)
- Budget: ${budget ? `${currency || "INR"} ${budget.toLocaleString()}` : "Not specified"}
- Number of Travelers: ${adults || 1} adult(s), ${children || 0} child(ren), ${infants || 0} infant(s)
${passengers ? `- Passenger Details: ${passengers}` : ""}

**IMPORTANT - CURRENCY INFORMATION:**
- Currency Code: ${currency || "INR"}
- Currency Symbol: ${currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency || "INR"}
- All prices, accommodation costs, and budget recommendations must be in ${currency || "INR"} currency

**USER TRAVEL PREFERENCES:**
- Travel Themes Selected: ${travelThemes && travelThemes.length > 0 ? travelThemes.join(", ") : "None selected - plan for general exploration"}
- Travel Pace Preference: ${travelPace || "Not specified - use balanced pace"}
- Preferred Weather: ${weather || "Not specified - plan for all weather conditions"}
- Accommodation Type: ${accommodation || "Not specified - suggest variety of options"}
- Food Preferences: ${food || "Not specified - include diverse culinary experiences"}
- Transportation Mode: ${transport || "Not specified - suggest appropriate transport"}

**ADDITIONAL USER PREFERENCES:**
${additionalPreferences || "None specified"}

**CRITICAL REQUIREMENTS - MATCH THIS EXACT JSON STRUCTURE:**

{
  "tripHighlights": {
    "title": "Create an engaging title (3-8 words) that captures the essence of this trip based on destination and themes. Examples: 'A Cultural Journey Through Vietnam', 'Adventure Awaits in the Swiss Alps', 'Beach Paradise in Bali'",
    "description": "Write a compelling paragraph (4-6 sentences) that describes the overall trip experience, highlights what makes it special, mentions key attractions or activities, and sets the right expectations. Make it inspiring and specific to the destination and user preferences."
  },
  "itinerary": [
"itinerary": [
{
"day": 1,
"date": "${itineraryDates[0] || startDateObj.toISOString().split("T")[0]}",
"title": "Create a descriptive day title. For Day 1, use 'Travel Day: Arrival at [Destination]' or 'Journey from [Start City] to [Destination]'. For last day, use 'Return Travel: Departure from [Destination]' or 'Journey Back to [Start City]'. For middle days, use titles like 'Exploring [Specific Area]' or 'Cultural Immersion Day'",
"morning": {
"activities": ["Provide 2-4 specific, time-stamped activities in 'HH:MM AM/PM - Activity' format. Be detailed and location-specific. Examples: '07:30 AM - Visit the Old Quarter and Hoan Kiem Lake', '09:00 AM - Explore the Colosseum and Roman Forum', '06:30 AM - Take a sunrise yoga class on the beach'"],
"description": "Write 1-2 sentences describing the morning plan. Include timing suggestions if relevant (e.g., 'Start early around 8:00 AM to avoid crowds'). Make it specific to the destination and day."
},
"afternoon": {
"activities": ["Provide 2-4 specific, time-stamped activities in 'HH:MM AM/PM - Activity' format. Examples: '12:30 PM - Visit the Temple of Literature', '01:00 PM - Lunch at a local market and try street food', '03:30 PM - Take a guided tour of the historic district'"],
"description": "Write 1-2 sentences describing the afternoon plan. Consider the travel pace - if 'slow', suggest fewer activities; if 'fast', suggest more. Make it specific."
},
"evening": {
"activities": ["Provide 2-3 specific, time-stamped evening activities in 'HH:MM AM/PM - Activity' format. Examples: '06:30 PM - Dinner at a rooftop restaurant with city views', '08:00 PM - Watch a traditional cultural show', '07:30 PM - Evening stroll through the night market'"],
"description": "Write 1-2 sentences describing the evening plan. Consider local culture and nightlife, and keep timing realistic after the afternoon activities."
},
"night": {
"activities": ["Optional - only if relevant. Provide time-stamped activities in 'HH:MM AM/PM - Activity' format. Examples: '09:30 PM - Night market shopping', '10:30 PM - Late-night cafe visit', '11:00 PM - Stargazing tour'"],
"description": "Optional night activities if relevant to destination"
},
"foodRecommendations": ["Provide 3-5 specific food recommendations. Include restaurant names, local dishes, or food experiences. You may optionally include suggested meal times like '12:30 PM - Pho at Pho Gia Truyen', '08:00 AM - Try Banh Mi from street vendors', '04:00 PM - Egg Coffee at Cafe Giang'"],
"stayOptions": [
  "Provide 3 accommodation options with realistic price ranges in ${currency || 'INR'} based on the user's total trip budget and per-day cost limit.",
  "Determine an estimated daily budget by dividing the total trip budget across the number of trip days (${days}).",
  "Accommodation price must NOT exceed 30–45% of the daily budget allocation unless the destination is known to be expensive.",
  "Match the accommodation preference (${accommodation || 'any'}) when selecting property types (e.g., hostels, mid-range hotels, Airbnb, 5-star resorts).",
  "Clearly label the options by category like: 'Value Stay', 'Comfort Hotel', 'Premium Experience' — but ensure all listed stays are affordable within the user's overall budget."
],

"optionalActivities": ["Provide 2-3 optional activities that can be added if time permits. You may include approximate times. Examples: '02:00 PM - Visit a local cooking class', '05:00 PM - Take a boat tour', '11:00 AM - Explore nearby villages'"],
"quickBookings": ["Provide 3-4 booking suggestions relevant to the day. Examples: 'Book 09:00 AM time slot for [Attraction]', 'Reserve a 07:30 PM table at [Restaurant]', 'Pre-book 03:00 PM [Activity/Tour]'"],
"tip": "Write a helpful, practical tip for this specific day (1-2 sentences). Examples: 'Start early around 8:00 AM to avoid crowds at popular attractions', 'Carry cash as many local vendors don't accept cards', 'Wear comfortable shoes for walking tours'"
}
    // Generate exactly ${days} days - one object for each day
  ],
  
  "bestTimeToVisit": {
    "description": "Write a detailed paragraph (4-5 sentences) explaining when is the best time to visit ${destination || "this destination"} based on weather patterns, tourist seasons, festivals, and activities available. Consider the user's travel dates and provide context.",
    "peakSeason": "Provide month range based on destination. Examples: 'December - March', 'June - August', 'April - May and October - November'",
    "shoulderSeason": "Provide month range for shoulder season. Examples: 'April - June, September - November', 'March - May, September - October'",
    "offSeason": "Provide month range for off-season. Examples: 'July - August', 'January - February', 'November - February'"
  },
  "packingSuggestions": {
    "clothing": ["Provide 5-8 specific clothing items based on destination, weather preference (${weather || "general"}), and trip duration. Examples: 'Lightweight t-shirts (5-7 pieces)', 'Long pants for temple visits (2-3 pairs)', 'Rain jacket or umbrella', 'Comfortable walking shoes'"],
    "essentials": ["Provide 4-6 essential items. Examples: 'Travel adapter and power bank', 'Reusable water bottle', 'First aid kit', 'Travel insurance documents'"],
    "toiletries": ["Provide 5-7 toiletry items. Examples: 'Sunscreen SPF 50+', 'Insect repellent', 'Personal hygiene items', 'Wet wipes'"],
    "electronics": ["Provide 4-6 electronic items. Examples: 'Camera or smartphone with good camera', 'Portable charger', 'Universal travel adapter', 'Headphones'"],
    "documents": ["Provide 4-6 document items. Examples: 'Valid passport (6+ months validity)', 'Visa (if required)', 'Travel insurance documents', 'Flight tickets', 'Hotel reservations'"],
    "other": ["Provide 3-5 miscellaneous items specific to destination or activities. Examples: 'Daypack for day trips', 'Travel guidebook', 'Money belt', 'Portable Wi-Fi device'"]
  }
}

**CRITICAL INSTRUCTIONS:**
1. Generate exactly ${days} itinerary days - one object for each day from day 1 to day ${days}
2. Use the exact dates provided: ${itineraryDates.join(", ")}
3. **Day 1 (${formatDateUTC(startDateObj)}):** This is the TRAVEL DAY from ${startCity || "starting point"} to ${destination || "destination"}. Include:
   - Morning: Travel from ${startCity || "starting point"} (flight/train/bus departure)
   - Afternoon: Arrival at ${destination || "destination"}, check-in to accommodation, settling in
   - Evening: Light exploration near accommodation, early dinner, rest after travel
   - Keep activities minimal as this is primarily a travel/arrival day
4. **Day ${days} (${formatDateUTC(endDateObj)}):** This is the RETURN TRAVEL DAY from ${destination || "destination"} back to ${startCity || "starting point"}. Include:
   - Morning: Final activities, last-minute shopping, check-out from accommodation
   - Afternoon: Travel preparation, departure from ${destination || "destination"} (flight/train/bus departure)
   - Evening: Arrival back at ${startCity || "starting point"}
   - Keep activities minimal as this is primarily a travel/departure day
5. Make ALL content specific to ${destination || "the destination"} - use real place names, attractions, and local culture
6. Consider travel pace: ${travelPace === "slow" ? "Plan fewer activities per day, allow time for relaxation" : travelPace === "fast" ? "Plan more activities, maximize time efficiency" : "Balance activities with rest time"}
7. Match food preferences: ${food === "vegetarian" ? "Focus on vegetarian restaurants and dishes" : food === "vegan" ? "Focus on vegan-friendly options" : food === "local" ? "Emphasize local cuisine and street food" : "Include diverse food options"}
8. Match accommodation preference: ${accommodation === "hostel" ? "Suggest budget-friendly hostels" : accommodation === "airbnb" ? "Suggest Airbnb options" : accommodation === "5star" ? "Suggest luxury 5-star hotels" : "Suggest variety from budget to luxury"}
9. Incorporate travel themes: ${travelThemes && travelThemes.length > 0 ? travelThemes.map(t => `- ${t}`).join("\\n") : "- General travel and exploration"}
10. Stay within budget: ${budget ? `Total budget is ${currency || "INR"} ${budget.toLocaleString()} - make recommendations realistic for this budget` : "Budget not specified - suggest options across price ranges"}
11. Consider group size: ${adults || 1} adults, ${children || 0} children, ${infants || 0} infants - suggest activities suitable for this group
${additionalPreferences ? `12. SPECIFIC REQUEST: ${additionalPreferences} - Make sure to incorporate this into the itinerary` : ""}

**IMPORTANT:**
- Weather information will be provided separately via API - do NOT include weather forecasts in your response
- Focus on creating realistic, actionable plans
- Use specific names of attractions, restaurants, and places when possible
- Make activities age-appropriate for the group (consider ${children || 0} children and ${infants || 0} infants)
- Ensure activities are physically feasible for the travel pace selected

Return ONLY valid JSON matching the exact structure above. No markdown, no code blocks, no explanations - just pure JSON.`;

  return prompt;
}

/**
 * Calculate max tokens for OpenAI API based on trip duration
 */
export function calculateMaxTokens(days: number): number {
  const baseTokens = 2000;
  const tokensPerDay = 1000;
  const calculatedMaxTokens = baseTokens + (days * tokensPerDay);
  return Math.min(Math.max(calculatedMaxTokens, 4000), 16000);
}

/**
 * Parse and validate AI response
 */
export function parseAIResponse(data: any, days: number): any {
  const { AIServiceError } = require("@/lib/errors");
  const { logger } = require("@/lib/logger");

if (typeof data === "string") {
  try {
    data = JSON.parse(data);
  } catch (err) {
    logger.error("String response not valid JSON:", data);
    throw new AIServiceError("Could not parse string AI response as JSON");
  }
}

if (typeof data !== "object") {
  logger.error("Invalid AI response structure:", data);
  throw new AIServiceError("Invalid AI response format");
}

  // At this point, `data` is expected to already be the parsed JSON:
  // {
  //   tripHighlights: {...},
  //   itinerary: [...],
  //   bestTimeToVisit: {...},
  //   packingSuggestions: {...}
  // }

  let aiPlanData = data;

  // ---- tripHighlights validation ----
  if (
    !aiPlanData.tripHighlights ||
    typeof aiPlanData.tripHighlights !== "object" ||
    !aiPlanData.tripHighlights.title ||
    !aiPlanData.tripHighlights.description
  ) {
    logger.warn("⚠️ tripHighlights missing or incomplete, using fallback");
    aiPlanData.tripHighlights = {
      title: "Your Travel Adventure",
      description: "A carefully planned trip based on your preferences.",
    };
  }

  // ---- itinerary validation ----
  if (!Array.isArray(aiPlanData.itinerary)) {
    logger.warn("⚠️ itinerary missing or invalid, using empty array");
    aiPlanData.itinerary = [];
  } else if (aiPlanData.itinerary.length < days) {
    logger.warn(
      `⚠️ itinerary has only ${aiPlanData.itinerary.length} days, expected ${days} days`
    );
  }

  // ---- bestTimeToVisit validation ----
  if (!aiPlanData.bestTimeToVisit || typeof aiPlanData.bestTimeToVisit !== "object") {
    logger.warn("⚠️ bestTimeToVisit missing, using fallback");
    aiPlanData.bestTimeToVisit = {
      description: "Based on your travel dates.",
      peakSeason: "Dec - Mar",
      shoulderSeason: "Apr - Jun, Sep - Nov",
      offSeason: "Jul - Aug",
    };
  }

  // ---- packingSuggestions validation ----
  if (
    !aiPlanData.packingSuggestions ||
    typeof aiPlanData.packingSuggestions !== "object"
  ) {
    logger.warn("⚠️ packingSuggestions missing, using fallback");
    aiPlanData.packingSuggestions = {
      clothing: [],
      essentials: [],
      toiletries: [],
      electronics: [],
      documents: [],
      other: [],
    };
  } else {
    // Ensure all expected packingSuggestion keys exist
    aiPlanData.packingSuggestions = {
      clothing: aiPlanData.packingSuggestions.clothing || [],
      essentials: aiPlanData.packingSuggestions.essentials || [],
      toiletries: aiPlanData.packingSuggestions.toiletries || [],
      electronics: aiPlanData.packingSuggestions.electronics || [],
      documents: aiPlanData.packingSuggestions.documents || [],
      other: aiPlanData.packingSuggestions.other || [],
    };
  }

  logger.log("✅ Validation summary:", {
    hasTripHighlights: !!aiPlanData.tripHighlights,
    itineraryDays: aiPlanData.itinerary?.length || 0,
    expectedDays: days,
    hasBestTimeToVisit: !!aiPlanData.bestTimeToVisit,
    hasPackingSuggestions: !!aiPlanData.packingSuggestions,
  });

  return aiPlanData;
}