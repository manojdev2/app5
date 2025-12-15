"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Plan as PlanType, AIPlanData } from "../shared/types";
import { Info, CloudRain, Plane, DollarSign, CheckSquare2, Calendar, MapPin, Sun, Moon, Wind, Thermometer, Umbrella, Briefcase, Camera, Car, UtensilsCrossed, ChevronDown, Hotel, Lightbulb, Star, ExternalLink, Download, Cloud, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";
import { format } from "date-fns";
import { generateHotelBookingUrl, generateRestaurantBookingUrl } from "@/lib/hotel-bookings";
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, Packer, FileChild } from "docx";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface PlanProps {
  plan: PlanType;
}

export default function Plan({ plan }: PlanProps) {
  const [activeSection, setActiveSection] = useState<string>("highlights");
  const [activeBudgetTab, setActiveBudgetTab] = useState<string>("essentials");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Parse AI-generated plan data
  let aiPlanData: AIPlanData | null = null;
  try {
    if (plan.text) {
      aiPlanData = JSON.parse(plan.text);
    }
  } catch (error) {
    console.error("Error parsing AI plan data:", error);
  }

  // Currency symbol mapping
  const getCurrencySymbol = (currencyCode?: string) => {
    const currencyMap: { [key: string]: string } = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      AUD: "A$",
      CAD: "C$",
      SGD: "S$",
      JPY: "¥",
      CNY: "¥",
      HKD: "HK$",
      CHF: "CHF",
      NZD: "NZ$",
      AED: "AED",
      SAR: "SAR",
      QAR: "QAR",
      KWD: "KWD",
      BHD: "BHD",
      OMR: "OMR",
      JOD: "JOD",
      SEK: "kr",
      NOK: "kr",
      DKK: "kr",
      PLN: "zł",
      CZK: "Kč",
      HUF: "Ft",
      RUB: "₽",
      TRY: "₺",
      THB: "฿",
      MYR: "RM",
      IDR: "Rp",
      PHP: "₱",
      VND: "₫",
      KRW: "₩",
      TWD: "NT$",
      MXN: "$",
      BRL: "R$",
      ARS: "$",
      CLP: "$",
      COP: "$",
      PEN: "S/",
      ZAR: "R",
      EGP: "E£",
      ILS: "₪",
      PKR: "₨",
      BDT: "৳",
      LKR: "₨",
      NPR: "₨",
      MMK: "K",
      KHR: "៛",
      LAK: "₭",
    };
    return currencyMap[currencyCode || "USD"] || currencyCode || "$";
  };

  const currencySymbol = getCurrencySymbol(plan.currency);

  // Get destination image - use OpenAI generated image or fallback
  const getDestinationImage = () => {
    // First priority: Use OpenAI generated image
    if (plan.destinationImage) {
      return plan.destinationImage;
    }
    
    // Second priority: Use first attraction image from places data
    if (plan.placesData?.attractions && plan.placesData.attractions.length > 0) {
      const firstAttraction = plan.placesData.attractions[0];
      if (firstAttraction.photoUrl) {
        return firstAttraction.photoUrl;
      }
    }
    
    // Fallback to default placeholder
    return "/city-1.jpeg";
  };

  const menuItems = useMemo(() => [
    { id: "highlights", label: "Trip Highlights", icon: Info },
    { id: "weather", label: "Weather Analysis", icon: CloudRain },
    { id: "itinerary", label: "Daily Itinerary", icon: Plane },
    { id: "budget", label: "Budget Breakdown", icon: DollarSign },
    { id: "packing", label: "Packing List", icon: CheckSquare2 },
  ], []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Get weather icon component and color based on OpenWeatherMap icon code
  const getWeatherIcon = (iconCode: string) => {
    // OpenWeatherMap icon codes: https://openweathermap.org/weather-conditions
    const code = iconCode.substring(0, 2); // Get first 2 characters (e.g., "01" from "01d")
    
    switch (code) {
      case "01": // Clear sky
        return { icon: Sun, color: "text-yellow-500" };
      case "02": // Few clouds
        return { icon: Cloud, color: "text-gray-500" };
      case "03": // Scattered clouds
        return { icon: Cloud, color: "text-gray-600" };
      case "04": // Broken clouds
        return { icon: Cloud, color: "text-gray-700" };
      case "09": // Shower rain
        return { icon: CloudDrizzle, color: "text-blue-500" };
      case "10": // Rain
        return { icon: CloudRain, color: "text-blue-600" };
      case "11": // Thunderstorm
        return { icon: CloudLightning, color: "text-purple-600" };
      case "13": // Snow
        return { icon: CloudSnow, color: "text-cyan-400" };
      case "50": // Mist/Fog
        return { icon: CloudFog, color: "text-gray-400" };
      default:
        return { icon: Cloud, color: "text-gray-600" };
    }
  };


  // Auto-highlight current section while scrolling
  useEffect(() => {
    const ids = menuItems.map((m) => m.id);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        // Account for header + tabs height
        rootMargin: "-120px 0px -60% 0px",
        threshold: [0.2, 0.6],
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [menuItems]);

  const toggleDay = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
  };

  const collapseAllDays = () => {
    setExpandedDays(new Set());
  };

  const expandAllDays = () => {
    const allDays = new Set<number>();
    for (let i = 0; i < days; i++) {
      allDays.add(i);
    }
    setExpandedDays(allDays);
  };

  const downloadDOC = async () => {
    try {
      // Create document sections
      const sections: FileChild[] = [];

      // Title Section
      sections.push(
        new Paragraph({
          text: plan.destination || "Your Travel Plan",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")} (${days} Days)`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Trip Highlights Section
      if (aiPlanData?.tripHighlights) {
        sections.push(
          new Paragraph({
            text: "Trip Highlights",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: aiPlanData.tripHighlights.title,
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: aiPlanData.tripHighlights.description,
            spacing: { after: 300 },
          })
        );
      }

      // Weather Analysis Section
      if (plan.weatherData) {
        sections.push(
          new Paragraph({
            text: "Weather Analysis",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: `Current Temperature: ${plan.weatherData.temperature.current}°C`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Temperature Range: ${plan.weatherData.temperature.min}°C - ${plan.weatherData.temperature.max}°C`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Humidity: ${plan.weatherData.humidity}%`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Wind Speed: ${plan.weatherData.windSpeed} km/h`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Conditions: ${plan.weatherData.description}`,
            spacing: { after: 300 },
          })
        );

        // Best Time to Visit
        if (aiPlanData?.bestTimeToVisit) {
          sections.push(
            new Paragraph({
              text: "Best Time to Visit",
              heading: HeadingLevel.HEADING_3,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: aiPlanData.bestTimeToVisit.description,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: `Peak Season: ${aiPlanData.bestTimeToVisit.peakSeason}`,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: `Shoulder Season: ${aiPlanData.bestTimeToVisit.shoulderSeason}`,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: `Off Season: ${aiPlanData.bestTimeToVisit.offSeason}`,
              spacing: { after: 300 },
            })
          );
        }
      }

      // Daily Itinerary Section
      if (aiPlanData?.itinerary && aiPlanData.itinerary.length > 0) {
        sections.push(
          new Paragraph({
            text: "Daily Itinerary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );

        aiPlanData.itinerary.forEach((day: AIPlanData['itinerary'][0]) => {
          const dayDate = day.date ? new Date(day.date) : new Date(startDate.getTime() + (day.day - 1) * 24 * 60 * 60 * 1000);
          
          sections.push(
            new Paragraph({
              text: `Day ${day.day}: ${day.title}`,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: format(dayDate, "EEEE, MMM dd, yyyy"),
                  italics: true,
                }),
              ],
              spacing: { after: 150 },
            })
          );

          // Morning
          if (day.morning) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Morning:",
                    bold: true,
                  }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                text: day.morning.description,
                spacing: { after: 50 },
              })
            );
            if (day.morning.activities && day.morning.activities.length > 0) {
              day.morning.activities.forEach((activity: string) => {
                sections.push(
                  new Paragraph({
                    text: `• ${activity}`,
                    spacing: { after: 50 },
                    indent: { left: convertInchesToTwip(0.5) },
                  })
                );
              });
            }
          }

          // Afternoon
          if (day.afternoon) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Afternoon:",
                    bold: true,
                  }),
                ],
                spacing: { before: 100, after: 50 },
              }),
              new Paragraph({
                text: day.afternoon.description,
                spacing: { after: 50 },
              })
            );
            if (day.afternoon.activities && day.afternoon.activities.length > 0) {
              day.afternoon.activities.forEach((activity: string) => {
                sections.push(
                  new Paragraph({
                    text: `• ${activity}`,
                    spacing: { after: 50 },
                    indent: { left: convertInchesToTwip(0.5) },
                  })
                );
              });
            }
          }

          // Evening
          if (day.evening) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Evening:",
                    bold: true,
                  }),
                ],
                spacing: { before: 100, after: 50 },
              }),
              new Paragraph({
                text: day.evening.description,
                spacing: { after: 50 },
              })
            );
            if (day.evening.activities && day.evening.activities.length > 0) {
              day.evening.activities.forEach((activity: string) => {
                sections.push(
                  new Paragraph({
                    text: `• ${activity}`,
                    spacing: { after: 50 },
                    indent: { left: convertInchesToTwip(0.5) },
                  })
                );
              });
            }
          }

          // Food Recommendations
          if (day.foodRecommendations && day.foodRecommendations.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Food Recommendations:",
                    bold: true,
                  }),
                ],
                spacing: { before: 100, after: 50 },
              })
            );
            day.foodRecommendations.forEach((food: string) => {
              sections.push(
                new Paragraph({
                  text: `• ${food}`,
                  spacing: { after: 50 },
                  indent: { left: convertInchesToTwip(0.5) },
                })
              );
            });
          }

          // Stay Options
          if (day.stayOptions && day.stayOptions.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Stay Options:",
                    bold: true,
                  }),
                ],
                spacing: { before: 100, after: 50 },
              })
            );
            day.stayOptions.forEach((stay: string) => {
              sections.push(
                new Paragraph({
                  text: `• ${stay}`,
                  spacing: { after: 50 },
                  indent: { left: convertInchesToTwip(0.5) },
                })
              );
            });
          }

          // Optional Activities
          if (day.optionalActivities && day.optionalActivities.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Optional Activities:",
                    bold: true,
                  }),
                ],
                spacing: { before: 100, after: 50 },
              })
            );
            day.optionalActivities.forEach((activity: string) => {
              sections.push(
                new Paragraph({
                  text: `• ${activity}`,
                  spacing: { after: 50 },
                  indent: { left: convertInchesToTwip(0.5) },
                })
              );
            });
          }

          // Tip
          if (day.tip) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Tip:",
                    bold: true,
                  }),
                ],
                spacing: { before: 100, after: 50 },
              }),
              new Paragraph({
                text: day.tip,
                spacing: { after: 200 },
              })
            );
          }
        });
      }

      // Budget Breakdown Section
      sections.push(
        new Paragraph({
          text: "Budget Breakdown",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          text: `Total Estimated Cost: ${currencySymbol}${(plan.budget * 0.7).toFixed(0)} - ${currencySymbol}${(plan.budget * 1.2).toFixed(0)}`,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `Per Day (Low): ${currencySymbol}${Math.floor((plan.budget * 0.7) / Math.max(days, 1)).toLocaleString()}`,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `Per Day (High): ${currencySymbol}${Math.floor((plan.budget * 1.2) / Math.max(days, 1)).toLocaleString()}`,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Essentials:",
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `• Accommodation: ${currencySymbol}${(plan.budget * 0.35).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.45).toFixed(0)}`,
          spacing: { after: 50 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          text: `• Food: ${currencySymbol}${(plan.budget * 0.25).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.35).toFixed(0)}`,
          spacing: { after: 50 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          text: `• Insurance: ${currencySymbol}${(plan.budget * 0.08).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.12).toFixed(0)}`,
          spacing: { after: 50 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          text: `• Contingency: ${currencySymbol}${(plan.budget * 0.15).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.25).toFixed(0)}`,
          spacing: { after: 200 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Activities:",
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `• Tours & Sightseeing: ${currencySymbol}${(plan.budget * 0.12).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.18).toFixed(0)}`,
          spacing: { after: 50 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          text: `• Entertainment: ${currencySymbol}${(plan.budget * 0.05).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.10).toFixed(0)}`,
          spacing: { after: 200 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Transport:",
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `• Local Transportation: ${currencySymbol}${(plan.budget * 0.08).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.12).toFixed(0)}`,
          spacing: { after: 50 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          text: `• Inter-city Travel: ${currencySymbol}${(plan.budget * 0.15).toFixed(0)} - ${currencySymbol}${(plan.budget * 0.25).toFixed(0)}`,
          spacing: { after: 300 },
          indent: { left: convertInchesToTwip(0.5) },
        })
      );

      // Packing List Section
      if (aiPlanData?.packingSuggestions) {
        sections.push(
          new Paragraph({
            text: "Packing List",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );

        const packingCategories = [
          { title: "Clothing", items: aiPlanData.packingSuggestions.clothing },
          { title: "Essentials", items: aiPlanData.packingSuggestions.essentials },
          { title: "Toiletries", items: aiPlanData.packingSuggestions.toiletries },
          { title: "Electronics", items: aiPlanData.packingSuggestions.electronics },
          { title: "Documents", items: aiPlanData.packingSuggestions.documents },
          { title: "Miscellaneous", items: aiPlanData.packingSuggestions.other },
        ];

        packingCategories.forEach((category) => {
          if (category.items && category.items.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${category.title}:`,
                    bold: true,
                  }),
                ],
                spacing: { before: 100, after: 50 },
              })
            );
            category.items.forEach((item: string) => {
              sections.push(
                new Paragraph({
                  text: `☐ ${item}`,
                  spacing: { after: 50 },
                  indent: { left: convertInchesToTwip(0.5) },
                })
              );
            });
          }
        });
      }

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: sections,
          },
        ],
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const fileName = `${plan.destination || "Travel-Plan"}-${format(startDate, "yyyy-MM-dd")}.docx`;
      saveAs(blob, fileName);
      toast.success("Document Downloaded", {
        description: "Your travel plan has been saved successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error generating DOC:", error);
      toast.error("Download Failed", {
        description: "We couldn't generate the document. Please try again.",
        duration: 4000,
      });
    }
  };

  const exportToCalendar = () => {
    try {
      const itinerary = aiPlanData?.itinerary || [];
      let icsContent = "BEGIN:VCALENDAR\n";
      icsContent += "VERSION:2.0\n";
      icsContent += "PRODID:-//Travel Planner//Travel Plan//EN\n";
      icsContent += "CALSCALE:GREGORIAN\n";
      icsContent += "METHOD:PUBLISH\n";

      itinerary.forEach((day: AIPlanData['itinerary'][0], index: number) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + index);
        const dateStr = format(dayDate, "yyyyMMdd");
        
        // Create event for the day
        const title = `Day ${day.day}: ${day.title || "Travel Day"}`;
        const description = [
          day.morning?.description || "",
          day.afternoon?.description || "",
          day.evening?.description || "",
        ]
          .filter(Boolean)
          .join("\\n\\n");
        
        const activities = [
          ...(day.morning?.activities || []),
          ...(day.afternoon?.activities || []),
          ...(day.evening?.activities || []),
        ]
          .filter(Boolean)
          .join("\\n• ");

        const fullDescription = description + (activities ? "\\n\\nActivities:\\n• " + activities : "");

        icsContent += "BEGIN:VEVENT\n";
        icsContent += `UID:travel-plan-${plan.id || "plan"}-day-${day.day}@travelplanner.com\n`;
        icsContent += `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}\n`;
        icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
        icsContent += `DTEND;VALUE=DATE:${dateStr}\n`;
        icsContent += `SUMMARY:${title}\n`;
        icsContent += `DESCRIPTION:${fullDescription}\n`;
        icsContent += `LOCATION:${plan.destination || "Travel Destination"}\n`;
        icsContent += "END:VEVENT\n";
      });

      icsContent += "END:VCALENDAR\n";

      // Create blob and download
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${plan.destination || "Travel-Plan"}-${format(startDate, "yyyy-MM-dd")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("Added to Calendar", {
        description: "Your trip has been added to your calendar successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error exporting to calendar:", error);
      toast.error("Calendar Export Failed", {
        description: "We couldn't add the trip to your calendar. Please try again.",
        duration: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="w-full">
        {/* Content - Single Column */}
        <main className="w-full bg-white">
          {/* Content Container with Padding */}
          <div id="plan-content" className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8 md:space-y-10">
            {/* Destination Hero Image */}
            <section className="relative h-[280px] sm:h-[320px] md:h-[400px] rounded-2xl overflow-hidden shadow-md border border-gray-200">
              <Image
                src={getDestinationImage()}
                alt="Destination"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <Button
                  onClick={exportToCalendar}
                  className="bg-white/90 hover:bg-white text-black border border-gray-200 shadow-lg text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
                  title="Add to Calendar"
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Add to Calendar</span>
                </Button>
                <Button
                  onClick={downloadDOC}
                  className="bg-white/90 hover:bg-white text-black border border-gray-200 shadow-lg text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
                  title="Download as DOC"
                >
                  <Download className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Download DOC</span>
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">{plan.destination || "Your Destination"}</h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-white/95">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium">{format(startDate, "MMM dd")} - {format(endDate, "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium">{days} Days Trip</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section Tabs - Top Nav (Centered, Segmented) */}
            <div className="sticky top-14 sm:top-16 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
              <div className="w-full px-2 sm:px-3 md:px-6 lg:px-8 xl:px-12">
                <div className="max-w-[1600px] mx-auto py-2 sm:py-3">
                  <div className="flex items-center justify-center">
                    <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-gray-200 bg-gray-50 px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-1 overflow-x-auto scrollbar-hide w-full sm:w-auto">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                              isActive
                                ? "text-white"
                                : "bg-transparent text-gray-700 hover:bg-white"
                            }`}
                            style={isActive ? {backgroundColor: '#DC6B5C'} : {}}
                            aria-label={`Jump to ${item.label}`}
                          >
                            <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${isActive ? "text-white" : "text-gray-600"}`} />
                            <span className="hidden sm:inline">{item.label}</span>
                            <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Highlights Section */}
            <section id="highlights" className="scroll-mt-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#DC6B5C'}}>
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black">Trip Highlights</h2>
                </div>
              
              {/* AI-Generated Trip Highlights */}
              {aiPlanData && aiPlanData.tripHighlights ? (
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-black mb-3 sm:mb-4">{aiPlanData.tripHighlights.title}</h3>
                  <div className="space-y-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                    <p>{aiPlanData.tripHighlights.description}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-black mb-3 sm:mb-4">Your Travel Adventure</h3>
                  <div className="space-y-3 text-gray-700 leading-relaxed">
                    <p>
                      Immerse yourself in the vibrant culture of your destination. This carefully curated itinerary 
                      takes you through the heart of the region, blending historical exploration with natural wonders.
                    </p>
                  </div>
                </div>
              )}

             
              </div>
            </section>

            {/* Weather Analysis Section */}
            <section id="weather" className="scroll-mt-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#DC6B5C'}}>
                    <CloudRain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black">Weather Analysis</h2>
                </div>
              
              {plan.weatherData ? (
                <div className="space-y-4">
                  {/* Current Weather - Enhanced */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-black mb-3">Current Conditions</h3>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
                      {/* Main Temperature Display */}
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                            {(() => {
                              const { icon: CurrentWeatherIcon, color } = getWeatherIcon(plan.weatherData.icon);
                              return <CurrentWeatherIcon className={`w-12 h-12 sm:w-16 sm:h-16 ${color}`} />;
                            })()}
                          </div>
                          <div>
                          <p className="text-2xl sm:text-3xl font-bold text-black leading-none">{plan.weatherData.temperature.current}°C</p>
                          <p className="text-xs sm:text-sm text-gray-600 capitalize">{plan.weatherData.description}</p>
                          </div>
                        </div>
                      
                      {/* Weather Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white flex items-center justify-center border border-gray-200 flex-shrink-0">
                              <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      </div>
                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide">Temperature</p>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-black">
                            {plan.weatherData.temperature.max}°C
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-600">
                            High / {plan.weatherData.temperature.min}°C Low
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white flex items-center justify-center border border-gray-200 flex-shrink-0">
                              <Umbrella className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        </div>
                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide">Humidity</p>
                        </div>
                          <p className="text-base sm:text-lg font-bold text-black">{plan.weatherData.humidity}%</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">
                            {plan.weatherData.humidity >= 70 ? "High" : plan.weatherData.humidity >= 40 ? "Moderate" : "Low"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white flex items-center justify-center border border-gray-200 flex-shrink-0">
                              <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      </div>
                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide">Wind Speed</p>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-black">{plan.weatherData.windSpeed}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">km/h</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white flex items-center justify-center border border-gray-200 flex-shrink-0">
                              <CloudRain className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                            </div>
                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide">Conditions</p>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-black capitalize leading-tight">
                            {plan.weatherData.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forecast */}
                  {plan.weatherData.forecast && plan.weatherData.forecast.length > 0 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-black mb-3">5-Day Forecast</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                        {plan.weatherData.forecast.map((day, index) => {
                          const { icon: WeatherIcon, color } = getWeatherIcon(day.icon);
                          return (
                            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 text-center">
                              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">{format(new Date(day.date), "EEE")}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">{format(new Date(day.date), "MMM dd")}</p>
                              <div className="mb-1.5 sm:mb-2 flex items-center justify-center">
                                <WeatherIcon className={`h-8 w-8 sm:h-10 sm:w-10 ${color}`} />
                              </div>
                              <div className="space-y-0.5 mb-1">
                                <p className="text-sm sm:text-base font-semibold text-black">{day.temp.max}°</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">{day.temp.min}°</p>
                              </div>
                              <p className="text-[10px] sm:text-xs text-gray-600 capitalize leading-tight line-clamp-1">{day.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Best Time to Visit - Enhanced */}
                  {aiPlanData && aiPlanData.bestTimeToVisit ? (
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6">Best Time to Visit</h3>
                      <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-sm p-4 sm:p-6 md:p-8">
                        <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">{aiPlanData.bestTimeToVisit.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                          <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#DC6B5C'}}>
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Peak Season</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">Most popular</p>
                          </div>
                          </div>
                            <p className="text-lg sm:text-xl font-bold text-black">{aiPlanData.bestTimeToVisit.peakSeason}</p>
                        </div>
                          <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Shoulder Season</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">Good balance</p>
                              </div>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-black">{aiPlanData.bestTimeToVisit.shoulderSeason}</p>
                          </div>
                          <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Off Season</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">Fewer crowds</p>
                              </div>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-black">{aiPlanData.bestTimeToVisit.offSeason}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6">Best Time to Visit</h3>
                      <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-sm p-4 sm:p-6 md:p-8">
                        <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                          Based on current weather conditions, this is an excellent time to visit.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                          <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#DC6B5C'}}>
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Peak Season</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">Most popular</p>
                          </div>
                          </div>
                            <p className="text-lg sm:text-xl font-bold text-black">Dec - Mar</p>
                        </div>
                          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Shoulder Season</p>
                                <p className="text-xs text-gray-500">Good balance</p>
                              </div>
                            </div>
                            <p className="text-xl font-bold text-black">Apr - Jun, Sep - Nov</p>
                          </div>
                          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Off Season</p>
                                <p className="text-xs text-gray-500">Fewer crowds</p>
                              </div>
                            </div>
                            <p className="text-xl font-bold text-black">Jul - Aug</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <p className="text-gray-600">Weather data will be available once you create a plan with a destination.</p>
                </div>
              )}
              </div>
            </section>

            {/* Daily Itinerary Section */}
            <section id="itinerary" className="scroll-mt-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#DC6B5C'}}>
                      <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black">Daily Itinerary</h2>
                  </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={collapseAllDays}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                  >
                    <span className="hidden sm:inline">Collapse All Days</span>
                    <span className="sm:hidden">Collapse</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={expandAllDays}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                  >
                    <span className="hidden sm:inline">Expand All Days</span>
                    <span className="sm:hidden">Expand</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {(aiPlanData && aiPlanData.itinerary && aiPlanData.itinerary.length > 0
                  ? aiPlanData.itinerary
                  : Array.from({ length: days }, (_, index) => {
                      const isTravelDay = index === 0;
                      return {
                      day: index + 1,
                      date: format(new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                        title: isTravelDay
                          ? "Travel Day (Departure)"
                          : index === days - 1
                          ? "Final Explorations and Return"
                          : "Exploring the Destination",
                        morning: isTravelDay
                          ? { activities: ["Pack essentials and documents", "Head to the airport/station"], description: "Departure from origin city." }
                          : { activities: [], description: "Breakfast and morning activities" },
                        afternoon: isTravelDay
                          ? { activities: ["In transit"], description: "Travel to destination. Arrival typically later in the day or next day." }
                          : { activities: [], description: "Lunch and afternoon exploration" },
                        evening: isTravelDay
                          ? { activities: ["Check arrival details", "Rest or light walk if time allows"], description: "Light evening due to travel." }
                          : { activities: [], description: "Dinner and evening entertainment" },
                      foodRecommendations: [],
                      stayOptions: [],
                      optionalActivities: [],
                      quickBookings: [],
                        tip: isTravelDay
                          ? "Keep travel documents and essentials handy; consider offline maps for arrival."
                          : "Start your day early to avoid crowds at popular attractions.",
                      };
                    })
                ).map((dayData, index) => {
                  const isExpanded = expandedDays.has(dayData.day - 1);
                  const dayDate = dayData.date ? new Date(dayData.date) : new Date(startDate.getTime() + (dayData.day - 1) * 24 * 60 * 60 * 1000);
                  const timeSlots = [
                    { label: "Morning", icon: Sun, data: dayData.morning },
                    { label: "Afternoon", icon: Sun, data: dayData.afternoon },
                    { label: "Evening", icon: Moon, data: dayData.evening },
                    ...((dayData as AIPlanData['itinerary'][0]).night ? [{ label: "Night", icon: Moon, data: (dayData as AIPlanData['itinerary'][0]).night! }] : []),
                  ];

                  return (
                    <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Day Header */}
                      <div
                        className="bg-white text-black px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between cursor-pointer border-b border-gray-200"
                        onClick={() => toggleDay(dayData.day - 1)}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold truncate">Day {dayData.day}: {dayData.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">{format(dayDate, "EEEE, MMM dd, yyyy")}</p>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>

                      {/* Day Content */}
                      {isExpanded && (
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                          {/* Time Slots */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {timeSlots.map((slot, slotIndex) => {
                              const Icon = slot.icon;
                              return (
                                <div key={slotIndex} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-700 flex-shrink-0" />
                                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                                    <span className="font-semibold text-black text-xs sm:text-sm">{slot.label}</span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">{slot.data.description}</p>
                                  {slot.data.activities && slot.data.activities.length > 0 && (
                                    <ul className="space-y-1 text-[11px] sm:text-xs text-gray-700">
                                      {slot.data.activities.slice(0, 2).map((activity: string, actIndex: number) => (
                                        <li key={actIndex} className="flex items-start gap-1">
                                          <span className="text-gray-700 mt-0.5 flex-shrink-0">•</span>
                                          <span className="break-words">{activity}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Additional Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Food Recommendations */}
                            {dayData.foodRecommendations && dayData.foodRecommendations.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                                  <h4 className="font-semibold text-black">Food Recommendations</h4>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-700">
                                  {dayData.foodRecommendations.map((food: string, foodIndex: number) => (
                                    <li key={foodIndex} className="flex items-start gap-2">
                                      <span className="text-orange-600 mt-1">•</span>
                                      <span>{food}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Stay Options */}
                            {dayData.stayOptions && dayData.stayOptions.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Hotel className="h-5 w-5 text-blue-600" />
                                  <h4 className="font-semibold text-black">Stay Options</h4>
                                </div>
                                <ul className="space-y-3 text-sm text-gray-700">
                                  {dayData.stayOptions.map((stay: string, stayIndex: number) => {
                                    // Parse date for this day (Day 1 is travel, check-in next day)
                                    const baseDate = new Date(startDate);
                                    baseDate.setDate(baseDate.getDate() + dayData.day - 1);
                                    const isTravelDay = dayData.day === 1;
                                    const checkInDate = new Date(baseDate);
                                    const checkOutDate = new Date(baseDate);
                                    if (isTravelDay) {
                                      checkInDate.setDate(checkInDate.getDate() + 1);
                                      checkOutDate.setDate(checkOutDate.getDate() + 2);
                                    } else {
                                    checkOutDate.setDate(checkOutDate.getDate() + 1);
                                    }

                                    const bookingUrl = generateHotelBookingUrl({
                                      destination: plan.destination || "",
                                      checkIn: checkInDate,
                                      checkOut: checkOutDate,
                                      adults: 2,
                                    });

                                    const colorClasses = [
                                      "bg-fuchsia-600 hover:bg-fuchsia-700",
                                      "bg-emerald-600 hover:bg-emerald-700",
                                      "bg-amber-600 hover:bg-amber-700",
                                      "bg-sky-600 hover:bg-sky-700",
                                    ];
                                    const stayColor = colorClasses[stayIndex % colorClasses.length];

                                    return (
                                      <li key={stayIndex} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start gap-2 flex-1">
                                          <span className="text-blue-600 mt-1">•</span>
                                          <span className="text-gray-700">{stay}</span>
                                        </div>
                                        <a
                                          href={bookingUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex-shrink-0 ${stayColor} text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap`}
                                        >
                                          <span>Book</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}

                            {/* Optional Activities */}
                            {dayData.optionalActivities && dayData.optionalActivities.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Camera className="h-5 w-5 text-purple-600" />
                                  <h4 className="font-semibold text-black">Optional Activities</h4>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-700">
                                  {dayData.optionalActivities.map((activity: string, actIndex: number) => (
                                    <li key={actIndex} className="flex items-start gap-2">
                                      <span className="text-purple-600 mt-1">•</span>
                                      <span>{activity}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Quick Bookings - Only Restaurant Table Reservations */}
                          {dayData.quickBookings && dayData.quickBookings.length > 0 && (() => {
                            // Filter to only show restaurant/table reservations
                            const restaurantBookings = dayData.quickBookings.filter((booking: string) => {
                              const bookingLower = booking.toLowerCase();
                              return bookingLower.includes('table') || 
                                     bookingLower.includes('reserve a table') ||
                                     bookingLower.includes('restaurant') ||
                                     bookingLower.includes('dining') ||
                                     (bookingLower.includes('reserve') && bookingLower.includes('table'));
                            });

                            // Only render if there are restaurant bookings
                            if (restaurantBookings.length === 0) return null;

                            return (
                            <div>
                              <h4 className="font-semibold text-black mb-3">Quick Bookings</h4>
                              <div className="flex flex-wrap gap-2">
                                  {restaurantBookings.map((booking: string, bookingIndex: number) => {
                                  const baseDate = new Date(startDate);
                                  baseDate.setDate(baseDate.getDate() + dayData.day - 1);
                                    
                                    // Extract restaurant name from booking text or use food recommendations
                                    let restaurantName: string | undefined;
                                    
                                    // Try to extract restaurant name from booking text
                                    // Remove common phrases like "Reserve a table at", "Book table at", etc.
                                    const cleanedBooking = booking
                                      .replace(/^(reserve|book|reservation)\s+(a\s+)?(table|dining)\s+(at|for|in)\s+/i, '')
                                      .replace(/^(reserve|book)\s+(a\s+)?table\s*/i, '')
                                      .trim();
                                    
                                    // If cleaned text is meaningful (not just "table" or "reserve"), use it as restaurant name
                                    if (cleanedBooking && 
                                        cleanedBooking.length > 3 && 
                                        !cleanedBooking.toLowerCase().match(/^(table|reserve|book|dining)$/i)) {
                                      restaurantName = cleanedBooking;
                                    }
                                    
                                    // If no restaurant name from booking text, try to get from food recommendations
                                    if (!restaurantName && dayData.foodRecommendations && dayData.foodRecommendations.length > 0) {
                                      // Get first food recommendation that looks like a restaurant name
                                      const firstFoodRec = dayData.foodRecommendations[0];
                                      // Check if it contains a restaurant name (usually before "for" or "at" or contains restaurant indicators)
                                      const restaurantMatch = firstFoodRec.match(/([^,]+?)(?:\s+(?:at|for|in|restaurant|dining)|$)/i);
                                      if (restaurantMatch && restaurantMatch[1]) {
                                        restaurantName = restaurantMatch[1].trim();
                                      } else if (firstFoodRec.length < 50) {
                                        // If it's short, might be a restaurant name
                                        restaurantName = firstFoodRec;
                                      }
                                    }
                                    
                                    // Build query: prioritize destination location, add restaurant name if available
                                    let searchQuery = plan.destination || "";
                                    if (restaurantName && searchQuery) {
                                      // Include restaurant name with location for better search results
                                      searchQuery = `${restaurantName}, ${searchQuery}`;
                                    } else if (restaurantName) {
                                      searchQuery = restaurantName;
                                    }
                                    
                                    // Generate restaurant booking URL with location
                                    const bookingUrl = generateRestaurantBookingUrl({
                                      destination: searchQuery,
                                      restaurantName: restaurantName,
                                      date: baseDate,
                                      partySize: 2,
                                    });

                                  const colorChip = [
                                    "border-fuchsia-600 text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white",
                                    "border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white",
                                    "border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white",
                                    "border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white",
                                  ][bookingIndex % 4];

                                    return (
                                      <a
                                        key={bookingIndex}
                                        href={bookingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors font-medium text-sm ${colorChip}`}
                                      >
                                        <span>{booking}</span>
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                  );
                                })}
                              </div>
                            </div>
                            );
                          })()}

                          {/* Tip Section */}
                          {dayData.tip && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-black mb-1">Tip</h4>
                                  <p className="text-sm text-gray-700">{dayData.tip}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            </section>

            {/* Budget Breakdown Section */}
            <section id="budget" className="scroll-mt-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#DC6B5C'}}>
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black">Budget Breakdown</h2>
                </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Totals & Stats */}
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs tracking-wide text-gray-700 mb-1">TOTAL ESTIMATED COST</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-black">
                    {currencySymbol}{(plan.budget * 0.7).toFixed(0)} - {currencySymbol}{(plan.budget * 1.2).toFixed(0)}
                  </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
                      <div className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200">
                        <p className="text-[10px] sm:text-[11px] text-gray-600">Duration</p>
                        <p className="text-xs sm:text-sm font-semibold text-black">{days} {days === 1 ? "day" : "days"}</p>
                      </div>
                      <div className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200">
                        <p className="text-[10px] sm:text-[11px] text-gray-600">Per Day (low)</p>
                        <p className="text-xs sm:text-sm font-semibold text-black">{currencySymbol}{Math.floor((plan.budget * 0.7) / Math.max(days,1)).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200">
                        <p className="text-[10px] sm:text-[11px] text-gray-600">Per Day (high)</p>
                        <p className="text-xs sm:text-sm font-semibold text-black">{currencySymbol}{Math.floor((plan.budget * 1.2) / Math.max(days,1)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white overflow-x-auto scrollbar-hide">
                  {[
                    { id: "essentials", label: "Essentials", icon: Briefcase },
                    { id: "activities", label: "Activities", icon: Camera },
                    { id: "transport", label: "Transport", icon: Car },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveBudgetTab(tab.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                          activeBudgetTab === tab.id
                            ? "text-black"
                            : "text-gray-600 border-transparent hover:text-black"
                        }`}
                        style={activeBudgetTab === tab.id ? {borderColor: '#DC6B5C'} : {}}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                

                {/* Tab Content with Progress Bars */}
                <div className="p-4 sm:p-6">
                  {activeBudgetTab === "essentials" && (
                    <div className="space-y-4">
                      {[
                        { label: "Accommodation", percentage: 40, color: "bg-fuchsia-600", min: plan.budget * 0.35, max: plan.budget * 0.45 },
                        { label: "Food", percentage: 30, color: "bg-emerald-600", min: plan.budget * 0.25, max: plan.budget * 0.35 },
                        { label: "Insurance", percentage: 10, color: "bg-amber-500", min: plan.budget * 0.08, max: plan.budget * 0.12 },
                        { label: "Contingency", percentage: 20, color: "bg-rose-500", min: plan.budget * 0.15, max: plan.budget * 0.25 },
                      ].map((item, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                            <span className="text-sm sm:text-base text-gray-700 font-medium">{item.label}</span>
                            <span className="text-sm sm:text-base text-black font-semibold">
                              {currencySymbol}{item.min.toFixed(0)} - {currencySymbol}{item.max.toFixed(0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeBudgetTab === "activities" && (
                    <div className="space-y-4">
                      {[
                        { label: "Tours & Sightseeing", percentage: 60, color: "bg-violet-600", min: plan.budget * 0.12, max: plan.budget * 0.18 },
                        { label: "Entertainment", percentage: 40, color: "bg-amber-500", min: plan.budget * 0.05, max: plan.budget * 0.10 },
                      ].map((item, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                            <span className="text-sm sm:text-base text-gray-700 font-medium">{item.label}</span>
                            <span className="text-sm sm:text-base text-black font-semibold">
                              {currencySymbol}{item.min.toFixed(0)} - {currencySymbol}{item.max.toFixed(0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeBudgetTab === "transport" && (
                    <div className="space-y-4">
                      {[
                        { label: "Local Transportation", percentage: 40, color: "bg-emerald-600", min: plan.budget * 0.08, max: plan.budget * 0.12 },
                        { label: "Inter-city Travel", percentage: 60, color: "bg-fuchsia-600", min: plan.budget * 0.15, max: plan.budget * 0.25 },
                      ].map((item, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                            <span className="text-sm sm:text-base text-gray-700 font-medium">{item.label}</span>
                            <span className="text-sm sm:text-base text-black font-semibold">
                              {currencySymbol}{item.min.toFixed(0)} - {currencySymbol}{item.max.toFixed(0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </section>

            

            {/* Packing List Section */}
            <section id="packing" className="scroll-mt-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#DC6B5C'}}>
                    <CheckSquare2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black">Packing List</h2>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {aiPlanData && aiPlanData.packingSuggestions ? (
                    <>
                      {aiPlanData.packingSuggestions.clothing && aiPlanData.packingSuggestions.clothing.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-black mb-3">Clothing</h3>
                          <ul className="space-y-2">
                            {aiPlanData.packingSuggestions.clothing.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" />
                                <span className="text-gray-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiPlanData.packingSuggestions.essentials && aiPlanData.packingSuggestions.essentials.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-black mb-3">Essentials</h3>
                          <ul className="space-y-2">
                            {aiPlanData.packingSuggestions.essentials.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" />
                                <span className="text-gray-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiPlanData.packingSuggestions.toiletries && aiPlanData.packingSuggestions.toiletries.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-black mb-3">Toiletries</h3>
                          <ul className="space-y-2">
                            {aiPlanData.packingSuggestions.toiletries.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" />
                                <span className="text-gray-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiPlanData.packingSuggestions.electronics && aiPlanData.packingSuggestions.electronics.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-black mb-3">Electronics</h3>
                          <ul className="space-y-2">
                            {aiPlanData.packingSuggestions.electronics.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" />
                                <span className="text-gray-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiPlanData.packingSuggestions.documents && aiPlanData.packingSuggestions.documents.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-black mb-3">Documents</h3>
                          <ul className="space-y-2">
                            {aiPlanData.packingSuggestions.documents.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" />
                                <span className="text-gray-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiPlanData.packingSuggestions.other && aiPlanData.packingSuggestions.other.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-black mb-3">Miscellaneous</h3>
                          <ul className="space-y-2">
                            {aiPlanData.packingSuggestions.other.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1" />
                                <span className="text-gray-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {[
                        {
                          category: "Clothing",
                          items: [
                            "Lightweight t-shirts (5-7)",
                            "Long pants (2-3 pairs)",
                            "Shorts (2 pairs)",
                            "Underwear (sufficient for trip)",
                            "Socks (5-7 pairs)",
                            "Light jacket or sweater",
                            "Rain jacket or umbrella",
                          ],
                        },
                        {
                          category: "Footwear",
                          items: [
                            "Comfortable walking shoes",
                            "Sandals or flip-flops",
                            "Sneakers for activities",
                          ],
                        },
                        {
                          category: "Electronics",
                          items: [
                            "Camera or smartphone",
                            "Chargers and adapters",
                            "Power bank",
                            "Headphones",
                          ],
                        },
                        {
                          category: "Toiletries",
                          items: [
                            "Toothbrush and toothpaste",
                            "Shampoo and conditioner",
                            "Soap or body wash",
                            "Sunscreen",
                            "Insect repellent",
                          ],
                        },
                        {
                          category: "Documents",
                          items: [
                            "Passport (valid for 6+ months)",
                            "Visa (if required)",
                            "Travel insurance documents",
                            "Flight tickets",
                            "Hotel reservations",
                          ],
                        },
                        {
                          category: "Other Essentials",
                          items: [
                            "First aid kit",
                            "Prescription medications",
                            "Reusable water bottle",
                            "Travel guidebook",
                            "Money belt",
                          ],
                        },
                      ].map((category, index) => (
                        <div key={index} className="space-y-3">
                          <h3 className="font-semibold text-black text-lg">{category.category}</h3>
                          <ul className="space-y-2">
                            {category.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
              </div>
            </section>
 {/* Real Places Data - Attractions */}
              {plan.placesData && plan.placesData.attractions && plan.placesData.attractions.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Top Attractions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {plan.placesData.attractions.slice(0, 6).map((attraction, index) => (
                      <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        {attraction.photoUrl && (
                          <div className="relative h-40 w-full">
                            <Image
                              src={attraction.photoUrl}
                              alt={attraction.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-black mb-1">{attraction.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{attraction.address}</p>
                          {attraction.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-medium text-black">{attraction.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Places Data - Restaurants */}
              {plan.placesData && plan.placesData.restaurants && plan.placesData.restaurants.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Recommended Restaurants</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {plan.placesData.restaurants.slice(0, 6).map((restaurant, index) => (
                      <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        {restaurant.photoUrl && (
                          <div className="relative h-32 w-full">
                            <Image
                              src={restaurant.photoUrl}
                              alt={restaurant.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                            <h4 className="font-semibold text-black">{restaurant.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
                          {restaurant.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-medium text-black">{restaurant.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Places Data - Hotels */}
              {plan.placesData && plan.placesData.hotels && plan.placesData.hotels.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-black mb-3 sm:mb-4">Accommodation Options</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {plan.placesData.hotels.slice(0, 6).map((hotel, index) => {
                      const bookingUrl = generateHotelBookingUrl({
                        destination: plan.destination || hotel.address || "",
                        checkIn: startDate,
                        checkOut: endDate,
                        adults: 2, // Default, can be enhanced
                      });

                      return (
                        <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                          {hotel.photoUrl && (
                            <div className="relative h-32 w-full">
                              <Image
                                src={hotel.photoUrl}
                                alt={hotel.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <Hotel className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold text-black">{hotel.name}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{hotel.address}</p>
                            <div className="flex items-center justify-between mb-3">
                              {hotel.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                  <span className="text-sm font-medium text-black">{hotel.rating}</span>
                                </div>
                              )}
                              {hotel.price && (
                                <div className="text-right">
                                  <p className="text-lg font-bold text-black">
                                    {currencySymbol}{hotel.price.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">per night</p>
                                </div>
                              )}
                            </div>
                            <a
                              href={bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-auto w-full text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                              style={{backgroundColor: '#DC6B5C'}}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a4d'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC6B5C'}
                            >
                              <span>Book Now</span>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              {hotel.price ? "Real-time price" : "Check"} • Powered by Booking.com
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}
