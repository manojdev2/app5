export interface Plan {
  id: string;
  text: string; // JSON string of AI-generated plan
  budget: number;
  startDate: string;
  endDate: string;
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
      price?: number;
      priceCurrency?: string;
      stars?: number;
    }>;
  };
  createdAt: Date | null;
}

export interface AIPlanData {
  tripHighlights: {
    title: string;
    description: string;
  };
  itinerary: Array<{
    day: number;
    date: string;
    title: string;
    morning: { activities: string[]; description: string };
    afternoon: { activities: string[]; description: string };
    evening: { activities: string[]; description: string };
    night?: { activities: string[]; description: string };
    foodRecommendations: string[];
    stayOptions: string[];
    optionalActivities: string[];
    quickBookings: string[];
    tip: string;
  }>;
  bestTimeToVisit: {
    description: string;
    peakSeason: string;
    shoulderSeason: string;
    offSeason: string;
  };
  packingSuggestions: {
    clothing: string[];
    essentials: string[];
    toiletries: string[];
    electronics: string[];
    documents: string[];
    other: string[];
  };
}
