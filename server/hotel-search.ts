"use strict";

/**
 * Free Hotel Search API Integration
 * 
 * Currently configured for BookingAPI.dev (5,000 free requests/month)
 * Can be easily switched to other providers
 */

import { logger } from "@/lib/logger";

export interface HotelSearchOptions {
  destination: string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  adults?: number;
  children?: number;
  rooms?: number;
  sortBy?: 'price' | 'popularity' | 'rating';
  minPrice?: number;
  maxPrice?: number;
  stars?: number;
}

export interface HotelSearchResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  price?: number;
  priceCurrency?: string;
  imageUrl?: string;
  amenities?: string[];
  stars?: number;
  bookingUrl?: string;
}

/**
 * Search hotels using BookingAPI.dev (FREE - 5,000 requests/month)
 */
export async function searchHotelsWithBookingAPI(
  options: HotelSearchOptions
): Promise<HotelSearchResult[] | null> {
  try {
    const apiKey = process.env.BOOKINGAPI_DEV_API_KEY;
    
    if (!apiKey) {
      logger.warn("BookingAPI.dev API key not configured. Using fallback.");
      return null;
    }

    const formatDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Build query parameters
    const params = new URLSearchParams({
      q: options.destination,
      adults: (options.adults || 2).toString(),
      rooms: (options.rooms || 1).toString(),
    });

    if (options.checkIn) {
      params.append('checkin', formatDate(options.checkIn));
    }
    if (options.checkOut) {
      params.append('checkout', formatDate(options.checkOut));
    }
    if (options.children) {
      params.append('children', options.children.toString());
    }
    if (options.sortBy) {
      params.append('sort_by', options.sortBy);
    }

    const response = await fetch(
      `https://api.bookingapi.dev/v1/hotels/search?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      logger.error(`BookingAPI.dev error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.hotels || !Array.isArray(data.hotels)) {
      return null;
    }

    // Transform API response to our format
    return data.hotels.map((hotel: any) => ({
      id: hotel.id || hotel.hotel_id || '',
      name: hotel.name || '',
      address: hotel.address || hotel.location?.address || '',
      rating: hotel.rating || hotel.review_score,
      price: hotel.price?.amount || hotel.min_price,
      priceCurrency: hotel.price?.currency || hotel.currency || 'USD',
      imageUrl: hotel.image_url || hotel.photos?.[0],
      amenities: hotel.amenities || [],
      stars: hotel.star_rating || hotel.stars,
      bookingUrl: hotel.booking_url,
    }));
  } catch (error) {
    logger.error("Error searching hotels with BookingAPI.dev:", error);
    return null;
  }
}

/**
 * Search hotels with StayAPI
 * Uses Google Hotels endpoint for real-time prices
 */
export async function searchHotelsWithStayAPI(
  options: HotelSearchOptions
): Promise<HotelSearchResult[] | null> {
  try {
    const apiKey = process.env.STAYAPI_API_KEY;
    
    if (!apiKey) {
      logger.warn("StayAPI API key not configured.");
      return null;
    }

    const formatDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Build query parameters for StayAPI Google Hotels endpoint
    const params = new URLSearchParams();
    params.append('location', options.destination || '');
    
    if (options.checkIn) {
      params.append('check_in', formatDate(options.checkIn));
    }
    if (options.checkOut) {
      params.append('check_out', formatDate(options.checkOut));
    }
    if (options.adults) {
      params.append('adults', options.adults.toString());
    } else {
      params.append('adults', '2');
    }
    params.append('currency', 'USD'); // Can be enhanced to use plan currency

    logger.log(`Searching hotels with StayAPI for: ${options.destination}`);

    const response = await fetch(
      `https://api.stayapi.com/v1/google_hotels/search?${params.toString()}`,
      {
        headers: {
          'x-api-key': apiKey, // StayAPI uses lowercase header
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`StayAPI error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    logger.log(`StayAPI returned ${data.hotels?.length || 0} hotels`);
    
    // Check various response formats
    const hotels = data.hotels || data.results || data.data || [];
    
    if (!Array.isArray(hotels) || hotels.length === 0) {
      logger.warn("StayAPI returned no hotels");
      return null;
    }

    // Transform StayAPI response to our format
    return hotels.map((hotel: any) => {
      // Handle price object structure from StayAPI
      let price: number | undefined;
      let priceCurrency: string = 'USD';
      
      if (hotel.price) {
        if (typeof hotel.price === 'object') {
          // Price is an object like { current: 172, price_per_night: 172, currency: 'USD' }
          price = hotel.price.current || hotel.price.price_per_night || hotel.price.regular;
          priceCurrency = hotel.price.currency || 'USD';
        } else if (typeof hotel.price === 'number') {
          price = hotel.price;
        }
      }
      
      // Handle rating object structure from StayAPI
      let rating: number | undefined;
      if (hotel.rating) {
        if (typeof hotel.rating === 'object' && hotel.rating.value !== undefined) {
          // Rating is an object like { value: 4, votes: 662, rating_max: 5 }
          rating = hotel.rating.value;
        } else if (typeof hotel.rating === 'number') {
          rating = hotel.rating;
        }
      }
      
      return {
        id: hotel.id || hotel.hotel_id || hotel.place_id || hotel.link || '',
        name: hotel.name || hotel.hotel_name || '',
        address: hotel.address || hotel.location?.address || hotel.formatted_address || hotel.location || '',
        rating: rating || hotel.review_score || hotel.reviews?.score,
        price: price || hotel.min_price || hotel.pricing?.amount,
        priceCurrency: priceCurrency || hotel.currency || hotel.pricing?.currency || hotel.price_currency || 'USD',
        imageUrl: hotel.image || hotel.image_url || hotel.photos?.[0]?.url || hotel.photos?.[0]?.getUrl?.() || hotel.photo || hotel.thumbnail,
        amenities: hotel.amenities || [],
        stars: hotel.stars || hotel.star_rating || (rating ? Math.round(rating) : undefined),
        bookingUrl: hotel.booking_url || hotel.link || hotel.deep_link || hotel.url,
      };
    });
  } catch (error) {
    logger.error("Error searching hotels with StayAPI:", error);
    return null;
  }
}

/**
 * Unified hotel search - tries multiple APIs
 * Falls back gracefully if APIs are unavailable
 * Priority: StayAPI (if configured) > BookingAPI.dev > Fallback to Google Places
 */
export async function searchHotels(
  options: HotelSearchOptions
): Promise<HotelSearchResult[] | null> {
  // Try StayAPI first if API key is configured (user preference)
  if (process.env.STAYAPI_API_KEY) {
    const stayAPIResults = await searchHotelsWithStayAPI(options);
    if (stayAPIResults && stayAPIResults.length > 0) {
      logger.log(`✅ StayAPI returned ${stayAPIResults.length} hotels`);
      return stayAPIResults;
    }
  }

  // Fallback to BookingAPI.dev if StayAPI unavailable or not configured
  const bookingAPIResults = await searchHotelsWithBookingAPI(options);
  if (bookingAPIResults && bookingAPIResults.length > 0) {
    logger.log(`✅ BookingAPI.dev returned ${bookingAPIResults.length} hotels`);
    return bookingAPIResults;
  }

  // If no API available, return null (will fall back to Google Places data)
  logger.log("No hotel API data available, will use Google Places data");
  return null;
}

/**
 * Get hotel details by ID
 */
export async function getHotelDetails(hotelId: string, provider: 'bookingapi' | 'stayapi' = 'bookingapi'): Promise<HotelSearchResult | null> {
  try {
    if (provider === 'bookingapi') {
      const apiKey = process.env.BOOKINGAPI_DEV_API_KEY;
      if (!apiKey) return null;

      const response = await fetch(
        `https://api.bookingapi.dev/v1/hotels/${hotelId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) return null;
      const hotel = await response.json();

      return {
        id: hotel.id || hotelId,
        name: hotel.name || '',
        address: hotel.address || '',
        rating: hotel.rating,
        price: hotel.price?.amount,
        priceCurrency: hotel.price?.currency || 'USD',
        imageUrl: hotel.image_url,
        amenities: hotel.amenities || [],
        stars: hotel.star_rating,
        bookingUrl: hotel.booking_url,
      };
    }

    return null;
  } catch (error) {
    logger.error("Error getting hotel details:", error);
    return null;
  }
}

