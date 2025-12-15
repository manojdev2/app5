"use strict";
"use server";

import { logger } from "@/lib/logger";

interface Place {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  types: string[];
  location: {
    lat: number;
    lng: number;
  };
}

interface PlacesData {
  attractions: Place[];
  restaurants: Place[];
  hotels: Place[];
}

export async function getPlacesData(
  city: string,
  country?: string
): Promise<PlacesData | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      logger.error("Google Maps API key not found");
      return null;
    }

    // Build query string - try different formats for better geocoding
    let queries = [];
    
    // Priority order: try with country first, then without
    if (country && country.trim()) {
      queries.push(`${city},${country}`);
      // If country is a code, also try without it
      if (country.length <= 3) {
        queries.push(city);
      }
    } else {
      queries.push(city);
    }
    
    logger.log(`Fetching places for: ${queries[0]}`);
    
    let geocodeData = null;
    let lastError = null;
    
    // Try each query format
    for (const query of queries) {
      try {
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
        );

        if (!geocodeResponse.ok) {
          logger.error(`Geocoding failed for: ${query}`);
          lastError = `HTTP ${geocodeResponse.status}`;
          continue;
        }

        const data = await geocodeResponse.json();

        if (data.results && data.results.length > 0) {
          geocodeData = data;
          logger.log(`Successfully found location: ${query}`);
          break;
        } else {
          lastError = "No results";
        }
      } catch (error) {
        logger.error(`Error geocoding ${query}:`, error);
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    if (!geocodeData || !geocodeData.results || geocodeData.results.length === 0) {
      logger.error(`Location not found for: ${country ? `${city},${country}` : city}`);
      logger.error(`Tried queries: ${queries.join(", ")}`);
      logger.error(`Last error: ${lastError}`);
      return null;
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Fetch places for different categories
    const [attractions, restaurants, hotels] = await Promise.all([
      searchNearbyPlaces(lat, lng, "tourist_attraction", apiKey),
      searchNearbyPlaces(lat, lng, "restaurant", apiKey),
      searchNearbyPlaces(lat, lng, "lodging", apiKey),
    ]);

    return {
      attractions: attractions || [],
      restaurants: restaurants || [],
      hotels: hotels || [],
    };
  } catch (error) {
    logger.error("Error fetching places data:", error);
    return null;
  }
}

async function searchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  apiKey: string,
  limit: number = 10
): Promise<Place[] | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.results) {
      return null;
    }

    return data.results.slice(0, limit).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address || "",
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photoUrl: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : undefined,
      types: place.types || [],
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
    }));
  } catch (error) {
    logger.error(`Error fetching ${type}:`, error);
    return null;
  }
}

export async function getPlaceDetails(placeId: string) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,photos,geometry,opening_hours,website,formatted_phone_number&key=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    logger.error("Error fetching place details:", error);
    return null;
  }
}

