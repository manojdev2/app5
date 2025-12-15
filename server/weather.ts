"use strict";
"use server";

import { logger } from "@/lib/logger";

interface WeatherData {
  temperature: {
    current: number;
    min: number;
    max: number;
  };
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
}

export async function getWeatherData(
  city: string,
  country?: string,
  startDate?: Date,
  endDate?: Date
): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      logger.error("OpenWeather API key not found");
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
    
    logger.log(`Fetching weather for: ${queries[0]}`);
    
    let geoData = null;
    let lastError = null;
    
    // Try each query format
    for (const query of queries) {
      try {
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`
        );

        if (!geoResponse.ok) {
          logger.error(`Geocoding failed for: ${query}`);
          lastError = `HTTP ${geoResponse.status}`;
          continue;
        }

        const data = await geoResponse.json();
        
        if (data && data.length > 0) {
          geoData = data;
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
    
    if (!geoData || geoData.length === 0) {
      logger.error(`Location not found for: ${country ? `${city},${country}` : city}`);
      logger.error(`Tried queries: ${queries.join(", ")}`);
      logger.error(`Last error: ${lastError}`);
      return null;
    }

    const { lat, lon } = geoData[0];

    // Get current weather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );

    if (!weatherResponse.ok) {
      logger.error("Weather API failed");
      return null;
    }

    const weatherData = await weatherResponse.json();

    // Get forecast if dates provided
    let forecast = undefined;
    if (startDate && endDate) {
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      );

      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        
        // Generate trip date range (YYYY-MM-DD format)
        const tripDates: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          const year = currentDate.getUTCFullYear();
          const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getUTCDate()).padStart(2, '0');
          tripDates.push(`${year}-${month}-${day}`);
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        // OpenWeather API returns 3-hour intervals, so we need to group by day
        // Group forecast items by date
        const dailyForecast = new Map<string, {
          date: string;
          temps: number[];
          items: Array<{ temp: number; description: string; icon: string; hour: number }>;
        }>();

        forecastData.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000);
          const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
          const hour = date.getHours();
          
          if (!dailyForecast.has(dateKey)) {
            dailyForecast.set(dateKey, {
              date: dateKey,
              temps: [],
              items: [],
            });
          }
          
          const dayData = dailyForecast.get(dateKey)!;
          dayData.temps.push(item.main.temp);
          dayData.items.push({
            temp: item.main.temp,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            hour: hour,
          });
        });

        // Map forecast to trip dates (up to 5 days)
        // Use the forecast data that matches trip dates, or closest available if exact match not found
        forecast = tripDates.slice(0, 5).map((tripDate) => {
          // Try to find exact date match first
          let dayData = dailyForecast.get(tripDate);
          
          // If no exact match, find the closest available forecast date
          if (!dayData) {
            const tripDateObj = new Date(tripDate + 'T00:00:00Z');
            let closestDate: string | null = null;
            let minDiff = Infinity;
            
            dailyForecast.forEach((data, dateKey) => {
              const forecastDateObj = new Date(dateKey + 'T00:00:00Z');
              const diff = Math.abs(tripDateObj.getTime() - forecastDateObj.getTime());
              if (diff < minDiff) {
                minDiff = diff;
                closestDate = dateKey;
              }
            });
            
            if (closestDate) {
              dayData = dailyForecast.get(closestDate);
            }
          }
          
          // If we found forecast data, process it
          if (dayData) {
            // Calculate min/max temperature for the day
            const minTemp = Math.round(Math.min(...dayData.temps));
            const maxTemp = Math.round(Math.max(...dayData.temps));
            
            // Find the midday entry (around 12:00) for icon and description
            // If no midday entry, use the entry closest to 12:00
            const middayEntry = dayData.items.reduce((closest, current) => {
              const closestDiff = Math.abs(closest.hour - 12);
              const currentDiff = Math.abs(current.hour - 12);
              return currentDiff < closestDiff ? current : closest;
            });
            
            return {
              date: tripDate, // Use trip date, not forecast date
              temp: {
                min: minTemp,
                max: maxTemp,
              },
              description: middayEntry.description,
              icon: middayEntry.icon,
            };
          }
          
          // Fallback if no forecast data available
          return {
            date: tripDate,
            temp: {
              min: 0,
              max: 0,
            },
            description: "No forecast available",
            icon: "01d",
          };
        });
      }
    }

    return {
      temperature: {
        current: Math.round(weatherData.main.temp),
        min: Math.round(weatherData.main.temp_min),
        max: Math.round(weatherData.main.temp_max),
      },
      humidity: weatherData.main.humidity,
      windSpeed: Math.round((weatherData.wind?.speed || 0) * 3.6), // Convert m/s to km/h
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      forecast,
    };
  } catch (error) {
    logger.error("Error fetching weather data:", error);
    return null;
  }
}

