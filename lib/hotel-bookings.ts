/**
 * Hotel Booking Utilities
 * Generates affiliate booking URLs for various hotel booking platforms
 */

export interface BookingLinkOptions {
  destination: string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  adults?: number;
  children?: number;
  rooms?: number;
  hotelId?: string;
  hotelName?: string;
}

/**
 * Generate Booking.com affiliate URL
 */
export function generateBookingComUrl(options: BookingLinkOptions): string {
  const affiliateId = process.env.NEXT_PUBLIC_BOOKING_COM_AFFILIATE_ID || '';
  
  // Format dates
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Build base URL
  let url = 'https://www.booking.com/searchresults.html';
  const params = new URLSearchParams();

  // Add destination
  if (options.destination) {
    params.append('ss', options.destination);
  }

  // Add dates
  if (options.checkIn) {
    params.append('checkin_monthday', formatDate(options.checkIn).split('-')[2]);
    params.append('checkin_month', formatDate(options.checkIn).split('-')[1]);
    params.append('checkin_year', formatDate(options.checkIn).split('-')[0]);
  }

  if (options.checkOut) {
    params.append('checkout_monthday', formatDate(options.checkOut).split('-')[2]);
    params.append('checkout_month', formatDate(options.checkOut).split('-')[1]);
    params.append('checkout_year', formatDate(options.checkOut).split('-')[0]);
  }

  // Add guests
  if (options.adults) {
    params.append('group_adults', options.adults.toString());
  }
  if (options.children) {
    params.append('group_children', options.children.toString());
  }
  if (options.rooms) {
    params.append('no_rooms', options.rooms.toString());
  }

  // Add affiliate ID
  if (affiliateId) {
    params.append('aid', affiliateId);
  }

  // If specific hotel ID provided
  if (options.hotelId) {
    url = `https://www.booking.com/hotel/${options.hotelId}.html`;
    params.delete('ss'); // Remove search params for specific hotel
    if (affiliateId) {
      params.append('aid', affiliateId);
    }
    return `${url}?${params.toString()}`;
  }

  return `${url}?${params.toString()}`;
}

/**
 * Generate Expedia affiliate URL
 */
export function generateExpediaUrl(options: BookingLinkOptions): string {
  const affiliateId = process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID || '';
  
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  };

  const url = 'https://www.expedia.com/Hotel-Search';
  const params = new URLSearchParams();

  params.append('destination', options.destination || '');
  
  if (options.checkIn) params.append('startDate', formatDate(options.checkIn));
  if (options.checkOut) params.append('endDate', formatDate(options.checkOut));
  if (options.adults) params.append('adults', options.adults.toString());
  if (options.rooms) params.append('rooms', options.rooms.toString());

  if (affiliateId) {
    params.append('affcid', affiliateId);
  }

  return `${url}?${params.toString()}`;
}

/**
 * Generate Hotels.com affiliate URL
 */
export function generateHotelsComUrl(options: BookingLinkOptions): string {
  const affiliateId = process.env.NEXT_PUBLIC_HOTELS_COM_AFFILIATE_ID || '';
  
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  };

  const url = 'https://www.hotels.com/search.do';
  const params = new URLSearchParams();

  params.append('q-destination', options.destination || '');
  
  if (options.checkIn) params.append('q-check-in', formatDate(options.checkIn));
  if (options.checkOut) params.append('q-check-out', formatDate(options.checkOut));
  if (options.adults) params.append('q-rooms', '1');
  if (options.adults) params.append('q-adults', options.adults.toString());

  if (affiliateId) {
    params.append('WAACI', affiliateId);
  }

  return `${url}?${params.toString()}`;
}

/**
 * Generate booking URL (defaults to Booking.com)
 * Can be extended to support multiple providers
 */
export function generateHotelBookingUrl(
  options: BookingLinkOptions,
  provider: 'booking.com' | 'expedia' | 'hotels.com' = 'booking.com'
): string {
  switch (provider) {
    case 'expedia':
      return generateExpediaUrl(options);
    case 'hotels.com':
      return generateHotelsComUrl(options);
    case 'booking.com':
    default:
      return generateBookingComUrl(options);
  }
}

/**
 * Check if affiliate IDs are configured
 */
export function areBookingLinksEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_BOOKING_COM_AFFILIATE_ID ||
    process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID ||
    process.env.NEXT_PUBLIC_HOTELS_COM_AFFILIATE_ID
  );
}

/**
 * Generate restaurant/table reservation URL
 * Uses Yelp for restaurant search - provides accurate restaurant data and booking options
 * Yelp shows restaurants with ratings, reviews, and links to reservation platforms
 */
export interface RestaurantBookingOptions {
  destination: string;
  restaurantName?: string;
  date?: Date | string;
  partySize?: number;
  time?: string; // e.g., "19:00" for 7 PM
}

export function generateRestaurantBookingUrl(options: RestaurantBookingOptions): string {
  // Build search query: prioritize restaurant name + location, fallback to destination
  let query = '';
  let location = options.destination || '';
  
  if (options.restaurantName && location) {
    // If both restaurant name and destination provided, search for specific restaurant
    query = encodeURIComponent(options.restaurantName);
    location = encodeURIComponent(location);
    // Yelp search URL format: https://www.yelp.com/search?find_desc=Restaurant+Name&find_loc=Location
    return `https://www.yelp.com/search?find_desc=${query}&find_loc=${location}`;
  } else if (options.restaurantName) {
    // Just restaurant name
    query = encodeURIComponent(options.restaurantName);
    return `https://www.yelp.com/search?find_desc=${query}`;
  } else if (location) {
    // Just location - search for restaurants in that area
    location = encodeURIComponent(location);
    return `https://www.yelp.com/search?find_desc=restaurants&find_loc=${location}`;
  } else {
    // Fallback to general restaurant search
    return `https://www.yelp.com/search?find_desc=restaurants`;
  }
}




