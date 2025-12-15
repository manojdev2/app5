"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Calendar as CalendarIconLucide, ArrowLeft, ArrowRight, Building2, Mountain, Globe, Waves, TreePine, Martini, Camera, ShoppingBag, Car, Clock, Plane, Sun, Wind, Snowflake, Cloud, Umbrella, Star, Home, Heart, Hotel, Leaf, Sprout, Ban, Moon, Scale, MapPin, Users, Minus, Plus, DollarSign, Coins } from "lucide-react";
import ReactSelect from "react-select";
import { Country, City } from "country-state-city";
import { generateTripPlan } from "@/server/ai";
import { formSchema as serverFormSchema } from "@/server/schemas";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Travel themes
const travelThemes = [
  { id: "historical", label: "Historical Sites and Landmarks", icon: Building2 },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "culture", label: "Local Culture", icon: Globe },
  { id: "beaches", label: "Beaches", icon: Waves },
  { id: "nature", label: "Hills, Nature and Wildlife", icon: TreePine },
  { id: "nightlife", label: "Nightlife", icon: Martini },
  { id: "instagram", label: "For the Gram", icon: Camera },
  { id: "shopping", label: "Shopping & Relaxation", icon: ShoppingBag },
];

// Travel preferences
const travelPace = [
  { id: "slow", label: "Slow and Easy", icon: Car },
  { id: "balanced", label: "Balanced", icon: Clock },
  { id: "fast", label: "Fast", icon: Plane },
];

const weatherOptions = [
  { id: "warm", label: "Warm and Sunny", icon: Sun },
  { id: "cool", label: "Cool and Breezy", icon: Wind },
  { id: "cold", label: "Cold and Snowy", icon: Snowflake },
  { id: "mild", label: "Mild and Pleasant", icon: Cloud },
  { id: "rainy", label: "Rainy and Cozy", icon: Umbrella },
];

const accommodationOptions = [
  { id: "3star", label: "3 Star", icon: Star },
  { id: "4star", label: "4 Star", icon: Star },
  { id: "5star", label: "5 Star", icon: Star },
  { id: "airbnb", label: "Airbnb", icon: Home },
  { id: "homestay", label: "Homestay", icon: Heart },
  { id: "hostel", label: "Hostel", icon: Hotel },
];

const foodOptions = [
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "vegan", label: "Vegan", icon: Sprout },
  { id: "gluten-free", label: "Gluten Free", icon: Ban },
  { id: "halal", label: "Halal", icon: Moon },
  { id: "kosher", label: "Kosher", icon: Scale },
  { id: "local", label: "Local Cuisine", icon: MapPin },
];

const transportOptions = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "trains", label: "Trains", icon: Car },
  { id: "buses", label: "Buses", icon: Car },
  { id: "road", label: "Road", icon: Car },
];

const STEP_INFO = [
  {
    title: "Set the Course, Own the Journey",
    description: "Define your dream destination and chart the perfect path to make it a reality.",
    illustration: "cityscape",
  },
  {
    title: "Craft Your Comfort Zone",
    description: "Customize your trip with the right balance of relaxation and adventure — make it truly yours.",
    illustration: "printer",
  },
  {
    title: "Trip Budget & Travel Companions",
    description: "Add the final touches with local gems and hidden treasures for an unforgettable experience.",
    illustration: "checklist",
  },
  {
    title: "Feasibility Check",
    description: "Reviewing your travel plan details.",
    illustration: "phone",
  },
] as const;

const currencies = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QAR", flag: "🇶🇦" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD", flag: "🇰🇼" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BHD", flag: "🇧🇭" },
  { code: "OMR", name: "Omani Rial", symbol: "OMR", flag: "🇴🇲" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JOD", flag: "🇯🇴" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", flag: "🇹🇼" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷" },
  { code: "CLP", name: "Chilean Peso", symbol: "$", flag: "🇨🇱" },
  { code: "COP", name: "Colombian Peso", symbol: "$", flag: "🇨🇴" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", flag: "🇵🇪" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨", flag: "🇱🇰" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₨", flag: "🇳🇵" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K", flag: "🇲🇲" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛", flag: "🇰🇭" },
  { code: "LAK", name: "Lao Kip", symbol: "₭", flag: "🇱🇦" },
];

const formSchema = z.object({
  startCity: z.string().min(1, "Start city is required"),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  travelThemes: z.array(z.string()).optional(),
  travelPace: z.string().optional(),
  weather: z.string().optional(),
  accommodation: z.string().optional(),
  food: z.string().optional(),
  transport: z.string().optional(),
  currency: z.string().optional(),
  budget: z.number().optional(),
  passengers: z.string().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  infants: z.number().optional(),
  additionalPreferences: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days <= 20;
  }
  return true;
}, {
  message: "Maximum trip duration is 20 days. Please select dates within 20 days.",
  path: ["endDate"],
});

type FormData = z.infer<typeof formSchema>;

export default function TravelPlannerForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [, setIsLoading] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [customThemes, setCustomThemes] = useState<Array<{id: string, label: string}>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelThemes: [],
      budget: 0,
      currency: "INR",
      adults: 1,
      children: 0,
      infants: 0,
    },
  });

  // Helper function to update passenger field
  const updatePassengerField = (form: ReturnType<typeof useForm<FormData>>) => {
    const adults = form.getValues("adults") || 0;
    const children = form.getValues("children") || 0;
    const infants = form.getValues("infants") || 0;
    
    let passengerText = "";
    if (adults > 0) {
      passengerText += `${adults} ${adults === 1 ? "adult" : "adults"}`;
    }
    if (children > 0) {
      if (passengerText) passengerText += ", ";
      passengerText += `${children} ${children === 1 ? "child" : "children"}`;
    }
    if (infants > 0) {
      if (passengerText) passengerText += ", ";
      passengerText += `${infants} ${infants === 1 ? "infant" : "infants"}`;
    }
    form.setValue("passengers", passengerText || "1 adult");
  };

  // Initialize passenger field on mount
  useEffect(() => {
    updatePassengerField(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    try {
      // Ensure all form data is properly formatted and serialized
      const formValues = form.getValues();
      
      // Ensure dates are defined
      const startDateValue = values.startDate || formValues.startDate;
      const endDateValue = values.endDate || formValues.endDate;
      
      if (!startDateValue || !endDateValue) {
        throw new Error("Start date and end date are required");
      }

      // Helper to convert Date to date-only string (YYYY-MM-DD) to avoid timezone issues
      const toDateOnlyString = (date: Date | string): string => {
        if (date instanceof Date) {
          // Extract year, month, day from local timezone (preserves the date user selected)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return date;
      };

      // Create properly serialized data for server action
      // Note: Server schema accepts Date | string, so we pass strings
      const serializedData = {
        startCity: formValues.startCity || values.startCity,
        destination: formValues.destination || values.destination,
        startDate: toDateOnlyString(startDateValue) as Date | string,
        endDate: toDateOnlyString(endDateValue) as Date | string,
        travelThemes: formValues.travelThemes || values.travelThemes || [],
        travelPace: formValues.travelPace || values.travelPace,
        weather: formValues.weather || values.weather,
        accommodation: formValues.accommodation || values.accommodation,
        food: formValues.food || values.food,
        transport: formValues.transport || values.transport,
        currency: formValues.currency || values.currency || "INR",
        budget: formValues.budget || values.budget || 0,
        passengers: formValues.passengers || values.passengers,
        adults: formValues.adults || values.adults || 1,
        children: formValues.children || values.children || 0,
        infants: formValues.infants || values.infants || 0,
        additionalPreferences: formValues.additionalPreferences || values.additionalPreferences,
      };
      
      // Log the payload for debugging
      console.log("Form data being sent to server action:", serializedData);
      
      // Pass all form data to the AI generation
      // Cast to server schema type which accepts Date | string
      const result = await generateTripPlan(serializedData as z.infer<typeof serverFormSchema>);
      
      // Check if result is an error object
      if (typeof result === 'object' && 'error' in result) {
        throw new Error(result.error);
      }
      
      // Result should be a plan ID string
      const planId = result;
      if (!planId || typeof planId !== 'string') {
        throw new Error("Failed to generate plan - no plan ID returned");
      }
      
      router.push(`/plan/${planId}`);
    } catch (error: unknown) {
      console.error("Error generating plan:", error);
      console.error("Error type:", error?.constructor?.name);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Extract error message from various error formats
      let errorMessage = "Failed to generate plan. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "error" in error) {
        const errorObj = error as { error?: { message?: string } | Error };
        if (errorObj.error instanceof Error) {
          errorMessage = errorObj.error.message;
        } else if (errorObj.error && typeof errorObj.error === "object" && "message" in errorObj.error) {
          errorMessage = String(errorObj.error.message);
        }
      } else if (error && typeof error === "object" && "toString" in error && typeof error.toString === "function") {
        errorMessage = error.toString();
      }
      
      // Show user-friendly error message based on error type
      if (errorMessage.includes("quota") || errorMessage.includes("insufficient_quota") || errorMessage.includes("Service Temporarily Unavailable")) {
        toast.error("Service Temporarily Unavailable", {
          description: "We're experiencing high demand. Please try again in a few moments.",
          duration: 5000,
        });
      } else if (errorMessage.includes("Rate limit") || errorMessage.includes("rate limit")) {
        toast.error("Rate Limit Exceeded", {
          description: "Please wait a moment and try again.",
          duration: 5000,
        });
      } else if (errorMessage.includes("INSUFFICIENT_CREDITS") || errorMessage.includes("credits") || errorMessage.includes("Insufficient credits")) {
        // Extract credit numbers from error message
        const creditMatch = errorMessage.match(/You need (\d+) credits.*?you only have (\d+) credits/i);
        const needsCredits = creditMatch ? creditMatch[1] : "100";
        const hasCredits = creditMatch ? creditMatch[2] : "0";
        
        toast.error("Out of Credits 💳", {
          description: `You need ${needsCredits} credits to generate a plan, but you only have ${hasCredits} credits. Purchase more credits to continue planning your amazing trip!`,
          duration: 8000,
          action: {
            label: "Buy Credits Now",
            onClick: () => {
              router.push("/credits");
            },
          },
        });
      } else if (errorMessage.includes("Authentication") || errorMessage.includes("sign in")) {
        toast.error("Authentication Required", {
          description: "Please sign in to generate a travel plan.",
          duration: 5000,
        });
      } else if (errorMessage.includes("Maximum trip duration") || errorMessage.includes("20 days")) {
        toast.error("Trip Duration Limit Exceeded", {
          description: "Maximum trip duration is 20 days. Please select dates within 20 days to generate your itinerary.",
          duration: 6000,
        });
      } else if (errorMessage.includes("Invalid date range")) {
        toast.error("Invalid Date Range", {
          description: errorMessage,
          duration: 5000,
        });
      } else if (errorMessage.includes("AI service") || errorMessage.includes("OpenAI")) {
        toast.error("AI Service Error", {
          description: errorMessage.includes("AI service") ? errorMessage : "The AI service is temporarily unavailable. Please try again in a few moments.",
          duration: 5000,
        });
      } else {
        // For unknown errors, show a generic but helpful message
        toast.error("Failed to Generate Plan", {
          description: errorMessage.length > 100 ? "An unexpected error occurred. Please try again or contact support if the issue persists." : errorMessage,
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    // Validate required fields for step 1 before proceeding
    if (currentStep === 1) {
      const isValid = await form.trigger(["startCity", "destination", "startDate", "endDate"]);
      if (!isValid) {
        // Find and scroll to first error field
        const errors = form.formState.errors;
        const errorFields = ["startCity", "destination", "startDate", "endDate"];
        const fieldLabels: Record<string, string> = {
          startCity: "Start City",
          destination: "Destination",
          startDate: "Start Date",
          endDate: "End Date",
        };
        
        for (const field of errorFields) {
          if (errors[field as keyof typeof errors]) {
            const fieldLabel = fieldLabels[field] || field;
            const errorMessage = errors[field as keyof typeof errors]?.message;
            
            // Check if it's the 20-day limit error
            if (errorMessage && errorMessage.includes("Maximum trip duration")) {
              toast.error("Trip Duration Limit Exceeded", {
                description: "Maximum trip duration is 20 days. Please select dates within 20 days to continue.",
                duration: 6000,
              });
            } else {
              toast.error("Missing Required Information", {
                description: `Please fill in the ${fieldLabel} field before continuing.`,
                duration: 4000,
              });
            }
            
            // Try to find the error message element and scroll to it
            const errorElement = document.querySelector(`[data-field="${field}"]`) || 
                                 document.querySelector(`[id="${field}"]`) ||
                                 document.querySelector(`[name="${field}"]`);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
              // Focus the field if possible
              const inputElement = errorElement.querySelector("input, button, [role='combobox']") as HTMLElement;
              if (inputElement) {
                inputElement.focus();
              }
            }
            break;
          }
        }
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      setCurrentStep(4);
      // Auto-submit after showing loading
      setTimeout(() => {
        form.handleSubmit(onSubmit)();
      }, 3000); // 3 seconds for loading
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleTheme = (themeId: string) => {
    const isCurrentlySelected = selectedThemes.includes(themeId);
    const newThemes = isCurrentlySelected
      ? selectedThemes.filter((t) => t !== themeId)
      : [...selectedThemes, themeId];
    setSelectedThemes(newThemes);
    
    // Update form with theme names
    const currentThemes = form.getValues("travelThemes") || [];
    const theme = travelThemes.find(t => t.id === themeId);
    const customTheme = customThemes.find(t => t.id === themeId);
    
    if (theme) {
      // Predefined theme - use label
      const themeName = theme.label;
      if (isCurrentlySelected) {
        // Removing
        form.setValue("travelThemes", currentThemes.filter((t: string) => t !== themeName));
      } else {
        // Adding
        form.setValue("travelThemes", [...currentThemes, themeName]);
      }
    } else if (customTheme) {
      // Custom theme - use label
      const themeName = customTheme.label;
      if (isCurrentlySelected) {
        // Removing
        form.setValue("travelThemes", currentThemes.filter((t: string) => t !== themeName));
      } else {
        // Adding
        form.setValue("travelThemes", [...currentThemes, themeName]);
      }
    }
  };

  const addCustomTheme = (themeName: string) => {
    const customThemeId = `custom-${Date.now()}`;
    const newCustomTheme = { id: customThemeId, label: themeName };
    setCustomThemes([...customThemes, newCustomTheme]);
    
    // Add to selected themes
    const newThemes = [...selectedThemes, customThemeId];
    setSelectedThemes(newThemes);
    
    // Add theme name to form
    const currentThemes = form.getValues("travelThemes") || [];
    form.setValue("travelThemes", [...currentThemes, themeName]);
    
    return customThemeId;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Content form={form} selectedThemes={selectedThemes} toggleTheme={toggleTheme} customThemes={customThemes} addCustomTheme={addCustomTheme} />;
      case 2:
        return <Step2Content form={form} />;
      case 3:
        return <Step3Content form={form} />;
      case 4:
        return <Step4Content form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20 pb-8 px-4 sm:px-6">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-8rem)]">
          {/* Left Panel */}
          <div className="hidden lg:flex">
          <LeftPanel currentStep={currentStep} />
          </div>

          {/* Right Panel */}
          <div className="flex-1 bg-white p-4 sm:p-6 overflow-visible lg:overflow-y-auto">
            <div className="mb-6 lg:hidden">
              <MobileStepHeader currentStep={currentStep} />
            </div>
    <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col gap-6">
                <div className="flex-1">{renderStepContent()}</div>
                
                {currentStep !== 4 && (
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-0 mt-2 sm:mt-6 pt-4 border-t border-gray-200">
                      <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                      <Button
                      type="button"
                      onClick={nextStep}
                      className="text-white"
                      style={{backgroundColor: '#ff6725'}}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a4d'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC6B5C'}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Left Panel Component
function LeftPanel({ currentStep }: { currentStep: number }) {
  const currentInfo = STEP_INFO[currentStep - 1];

  return (
    <div className="w-80 bg-gradient-to-b from-gray-50 to-white p-6 flex flex-col border-r border-gray-200">
      <h1 className="text-2xl font-bold text-black mb-4">Create a Plan</h1>
      
      {/* Progress Indicator */}
      <div className="flex items-center gap-1.5 mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
                        className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2",
                step < currentStep
                  ? "text-white"
                  : step === currentStep
                  ? "text-white"
                  : "bg-transparent border-gray-300 text-gray-400"
              )}
              style={step <= currentStep ? {backgroundColor: '#DC6B5C', borderColor: '#DC6B5C'} : {}}
            >
              {step < currentStep ? "✓" : step}
            </div>
            {step < 4 && (
              <div
                className={cn(
                  "w-10 h-0.5 mx-1",
                  step < currentStep ? "bg-[#DC6B5C]" : "bg-gray-300"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center mb-4 min-h-[300px] overflow-hidden">
        <video
          src="/Untitled video - Made with Clipchamp (2).mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Step Info */}
      <div>
        <h2 className="text-xl font-bold text-black mb-1.5">{currentInfo.title}</h2>
        <p className="text-gray-600 text-xs leading-relaxed">{currentInfo.description}</p>
      </div>
    </div>
  );
}

function MobileStepHeader({ currentStep }: { currentStep: number }) {
  const currentInfo = STEP_INFO[currentStep - 1];

  return (
    <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Step {currentStep} of {STEP_INFO.length}
          </p>
          <h2 className="text-lg font-bold text-black">{currentInfo.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn(
                "w-2 h-2 rounded-full",
                step === currentStep
                  ? "bg-[#DC6B5C]"
                  : step < currentStep
                  ? "bg-[#DC6B5C]/50"
                  : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{currentInfo.description}</p>
    </div>
  );
}

// Step 1: Destination & Themes
interface Step1ContentProps {
  form: ReturnType<typeof useForm<FormData>>;
  selectedThemes: string[];
  toggleTheme: (theme: string) => void;
  customThemes: Array<{id: string, label: string}>;
  addCustomTheme: (theme: string) => void;
}
function Step1Content({ form, selectedThemes, toggleTheme, customThemes, addCustomTheme }: Step1ContentProps) {
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [startCityOptions, setStartCityOptions] = useState<Array<{value: string, label: string}>>([]);
  const [destinationOptions, setDestinationOptions] = useState<Array<{value: string, label: string}>>([]);
  const [startCityCustom, setStartCityCustom] = useState('');
  const [destinationCustom, setDestinationCustom] = useState('');
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [customTheme, setCustomTheme] = useState('');

  // Popular cities list (major cities worldwide)
  const popularCitiesList = useMemo(() => [
  // India (Major + Tourist)
  "Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur",
  "Nagpur", "Indore", "Thane", "Coimbatore", "Kochi", "Patna",
  "Bhopal", "Visakhapatnam", "Vadodara", "Ludhiana", "Nashik",
  "Madurai", "Vijayawada", "Rajkot", "Chandigarh", "Guwahati",
  "Bhubaneswar", "Noida", "Gurgaon", "Mysore", "Mangalore",
  "Varanasi", "Agra", "Meerut", "Jodhpur", "Udaipur",
  "Dehradun", "Haridwar", "Faridabad", "Ghaziabad",
  "Jamshedpur", "Ranchi", "Raipur", "Bilaspur",
  "Tiruchirappalli", "Salem", "Tirupati", "Warangal",
  "Gwalior", "Jabalpur", "Prayagraj", "Amritsar",
  "Aurangabad", "Kolhapur", "Patiala", "Hubli",
  "Belgaum", "Ajmer", "Kota", "Aligarh",
  "Bareilly", "Moradabad", "Srinagar", "Shimla",
  "Siliguri", "Durgapur",
  // Kerala Tourism
  "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam",
  "Alappuzha", "Munnar", "Thekkady", "Kumarakom",
  "Wayanad", "Idukki", "Kannur", "Varkala",
  "Kovalam", "Ernakulam", "Palakkad", "Kasargod",
  "Guruvayur", "Bekal", "Sabarimala",

  // USA & Canada
  "New York", "Los Angeles", "Chicago", "San Francisco",
  "Houston", "Seattle", "Washington D.C.", "Boston",
  "Miami", "Atlanta", "Dallas", "Phoenix", "Denver",
  "Las Vegas", "Orlando",
  "Toronto", "Vancouver", "Montreal", "Calgary",
  "Ottawa", "Quebec City", "Edmonton", "Winnipeg",

  // Mexico, Central & South America
  "Mexico City", "Guadalajara", "Lima", "Bogotá", "Medellín",
  "Santiago", "São Paulo", "Rio de Janeiro",
  "Buenos Aires", "Montevideo",

  // Europe
  "London", "Paris", "Berlin", "Rome", "Madrid", "Barcelona",
  "Amsterdam", "Brussels", "Zurich", "Geneva", "Vienna",
  "Dublin", "Stockholm", "Copenhagen", "Lisbon", "Prague",
  "Warsaw", "Budapest", "Helsinki", "Oslo",
  "Munich", "Frankfurt", "Manchester", "Milan",
  "Florence", "Venice", "Athens", "Edinburgh",
  "Istanbul", "Nice", "Lyon", "Porto",
  "Moscow", "Saint Petersburg",

  // Australia & New Zealand
  "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide",
  "Canberra", "Hobart", "Darwin", "Gold Coast",
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin",

  // Middle East & Gulf
  "Dubai", "Abu Dhabi", "Riyadh", "Jeddah", "Doha",
  "Kuwait City", "Manama", "Muscat", "Jerusalem", "Tel Aviv", "Sharjah",

  // East Asia
  "Tokyo", "Osaka", "Kyoto", "Seoul", "Busan",
  "Shanghai", "Beijing", "Shenzhen", "Hong Kong",
  "Taipei",

  // Southeast Asia
  "Singapore", "Bangkok", "Phuket", "Pattaya",
  "Ho Chi Minh City", "Hanoi", "Jakarta",
  "Manila", "Bali", "Chiang Mai", "Kuala Lumpur", "Phnom Penh",

  // South Asia
  "Colombo", "Kathmandu", "Malé", "Dhaka", "Karachi", "Lahore", "Islamabad",

  // Africa
  "Johannesburg", "Cape Town", "Nairobi", "Lagos",
  "Cairo", "Accra", "Casablanca", "Marrakech", "Tunis"
  ], []);

  // Load cities and countries on mount - optimized for performance
  useEffect(() => {
    setIsLoadingCities(true);
    
    // Use requestIdleCallback or setTimeout for non-blocking loading
    const loadCities = async () => {
      try {
        // First, load countries (small dataset, fast)
        const countries = Country.getAllCountries();
        const countryOpts = countries.map((country) => ({
          value: country.name,
          label: country.name,
        }));

        // Load cities in chunks to prevent UI blocking
        const allCities = City.getAllCities();
        
        // For START CITY: Use popular cities only (limited set for better performance)
        const popularCities = allCities .filter(city => 
          popularCitiesList.some(popular => 
            city.name.toLowerCase() === popular.toLowerCase() ||
            city.name.toLowerCase().includes(popular.toLowerCase()) || 
            popular.toLowerCase().includes(city.name.toLowerCase())
          )
        ); 
        
        // Also include cities that match capital city names and major capitals for start city
        const majorCapitals = ['Washington', 'Ottawa', 'Canberra', 'Wellington', 'Brasília', 'New Delhi', 'Islamabad', 'Dhaka', 'Colombo', 'Kathmandu', 'Thimphu', 'Male', 'Naypyidaw', 'Phnom Penh', 'Vientiane'];
        const capitals = allCities.filter(city => {
          const country = countries.find(c => c.isoCode === city.countryCode);
          return majorCapitals.some(cap => city.name.includes(cap)) ||
                 (country && city.name.toLowerCase() === country.name.toLowerCase());
        });

        // Combine and deduplicate for START CITY (popular cities only)
        const uniqueStartCities = new Map();
        [...popularCities, ...capitals].forEach(city => {
          if (!uniqueStartCities.has(city.name)) {
            uniqueStartCities.set(city.name, city);
          }
        });
        const selectedStartCities = Array.from(uniqueStartCities.values());
        
        // For DESTINATION: Limit to top 2000 major cities for performance
        // Prioritize: capitals, major cities, and cities with larger populations
        const uniqueDestinationCities = new Map();
        let processedCount = 0;
        const maxCities = 2000; // Limit to prevent performance issues
        
        // First, add all capitals
        const allCapitals = allCities.filter(city => {
          const country = countries.find(c => c.isoCode === city.countryCode);
          return country && (city.name.toLowerCase() === country.name.toLowerCase() || 
                 city.name.toLowerCase().includes(country.name.toLowerCase()));
        });
        
        allCapitals.forEach(city => {
          const key = `${city.name}-${city.countryCode}`;
          if (!uniqueDestinationCities.has(key) && processedCount < maxCities) {
            uniqueDestinationCities.set(key, city);
            processedCount++;
          }
        });
        
        // Then add popular/major cities
        popularCities.forEach(city => {
          const key = `${city.name}-${city.countryCode}`;
          if (!uniqueDestinationCities.has(key) && processedCount < maxCities) {
            uniqueDestinationCities.set(key, city);
            processedCount++;
          }
        });
        
        // Add remaining cities up to limit (prioritize by processing in batches)
        // Process in smaller chunks to prevent blocking
        if (processedCount < maxCities) {
          const batchSize = 50; // Process 50 cities at a time
          let cityIndex = 0;
          
          while (processedCount < maxCities && cityIndex < allCities.length) {
            const batch = allCities.slice(cityIndex, cityIndex + batchSize);
            
            for (const city of batch) {
              if (processedCount >= maxCities) break;
              const key = `${city.name}-${city.countryCode}`;
              if (!uniqueDestinationCities.has(key)) {
                uniqueDestinationCities.set(key, city);
                processedCount++;
              }
            }
            
            cityIndex += batchSize;
            
            // Yield to UI after each batch to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        const allDestinationCities = Array.from(uniqueDestinationCities.values());
        
        // Create options for start city (limited popular cities)
        const startCityOpts = selectedStartCities.map((city) => {
          const country = countries.find(c => c.isoCode === city.countryCode);
          return {
            value: `${city.name}, ${city.countryCode}`,
            label: `${city.name}, ${country?.name || city.countryCode}`,
          };
        });
        
        // Create options for destination (limited cities)
        const destinationCityOpts = allDestinationCities.map((city) => {
          const country = countries.find(c => c.isoCode === city.countryCode);
          return {
            value: `${city.name}, ${city.countryCode}`,
            label: `${city.name}, ${country?.name || city.countryCode}`,
          };
        });

        // Add "Other" option at the end
        const otherOption = { value: 'other', label: 'Other (Type custom location)' };
        
        // Set options - start city has limited popular cities, destination has limited cities + countries
        setStartCityOptions([...startCityOpts, otherOption]);
        setDestinationOptions([...countryOpts, ...destinationCityOpts, otherOption]);
        
        console.log(`Loaded ${countries.length} countries, ${selectedStartCities.length} start cities, ${allDestinationCities.length} destination cities`);
      } catch (error) {
        console.error('Error loading cities:', error);
        // Fallback to empty arrays if error
        setStartCityOptions([{ value: 'other', label: 'Other (Type custom location)' }]);
        setDestinationOptions([{ value: 'other', label: 'Other (Type custom location)' }]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    // Use setTimeout to defer loading and prevent blocking initial render
    const timeoutId = setTimeout(() => {
      loadCities();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [popularCitiesList]);

  const customSelectStyles = {
    control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
      ...base,
      backgroundColor: 'white',
      borderColor: state.isFocused ? '#9ca3af' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #9ca3af' : 'none',
      '&:hover': {
        borderColor: '#9ca3af',
      },
      minHeight: '40px',
      cursor: 'pointer',
    }),
    menu: (base: Record<string, unknown>) => ({
      ...base,
      backgroundColor: 'white',
      zIndex: 9999,
    }),
    menuPortal: (base: Record<string, unknown>) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#DC6B5C'
        : state.isFocused
        ? '#f3f4f6'
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#DC6B5C',
        color: 'white',
      },
    }),
    placeholder: (base: Record<string, unknown>) => ({
      ...base,
      color: '#9ca3af',
    }),
    singleValue: (base: Record<string, unknown>) => ({
      ...base,
      color: '#1f2937',
    }),
    input: (base: Record<string, unknown>) => ({
      ...base,
      color: '#1f2937',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: '#6b7280',
      '&:hover': {
        color: '#374151',
      },
    }),
  };

  return (
    <div className="space-y-4">
          <FormField
            control={form.control}
        name="startCity"
            render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black text-sm font-medium">Where are you starting your trip from? <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
              <div className="space-y-2">
                {isLoadingCities ? (
                  <Input
                    placeholder="Loading cities..."
                    disabled
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                ) : (
                  <>
                    <ReactSelect
                      options={startCityOptions}
                      value={startCityOptions.find(option => option.value === field.value && option.value !== 'other') || null}
                      onChange={(selected) => {
                        if (selected?.value === 'other') {
                          field.onChange('other');
                          setStartCityCustom('');
                        } else if (selected) {
                          field.onChange(selected.value);
                          setStartCityCustom('');
                        } else {
                          field.onChange('');
                          setStartCityCustom('');
                        }
                      }}
                      placeholder="Select or search for your start city..."
                      isSearchable
                      styles={customSelectStyles}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isLoading={isLoadingCities}
                      isClearable
                    />
                    {field.value === 'other' && (
                      <Input
                        value={startCityCustom}
                        onChange={(e) => {
                          setStartCityCustom(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        placeholder="Type your custom city/country..."
                        className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                      />
                    )}
                  </>
                )}
              </div>
                    </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
        name="destination"
            render={({ field }) => (
          <FormItem>
            <FormLabel className="text-black text-sm font-medium">Search for your destination country/city <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <div className="space-y-2">
                {isLoadingCities ? (
                  <Input
                    placeholder="Loading destinations..."
                    disabled
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                ) : (
                  <>
                    <ReactSelect
                      options={destinationOptions}
                      value={destinationOptions.find(option => option.value === field.value && option.value !== 'other') || null}
                      onChange={(selected) => {
                        if (selected?.value === 'other') {
                          field.onChange('other');
                          setDestinationCustom('');
                        } else if (selected) {
                          field.onChange(selected.value);
                          setDestinationCustom('');
                        } else {
                          field.onChange('');
                          setDestinationCustom('');
                        }
                      }}
                      placeholder="Select or search for destination..."
                      isSearchable
                      styles={customSelectStyles}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      isLoading={isLoadingCities}
                      isClearable
                      filterOption={(option, searchText) => {
                        // Custom filter for better performance
                        if (!searchText) return true;
                        const search = searchText.toLowerCase();
                        const label = option.label?.toLowerCase() || '';
                        const value = option.value?.toLowerCase() || '';
                        return label.includes(search) || value.includes(search);
                      }}
                      maxMenuHeight={300}
                    />
                    {field.value === 'other' && (
                      <Input
                        value={destinationCustom}
                        onChange={(e) => {
                          setDestinationCustom(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        placeholder="Type your custom destination..."
                        className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                      />
                    )}
                  </>
                )}
              </div>
            </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
        name="startDate"
        render={({ field }) => {
          const startDate = field.value;
          const endDate = form.watch("endDate");
          const days = startDate && endDate 
            ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <FormItem>
              <FormLabel className="text-black text-sm font-medium">Select Dates <span className="text-red-500">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                      variant="outline"
                        className={cn(
                        "w-full justify-start text-left font-normal bg-white border-gray-300 text-black",
                        !startDate && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && endDate ? (
                        <span>
                          {format(new Date(startDate), "MMM dd, yyyy")} - {format(new Date(endDate), "MMM dd, yyyy")}
                          {days && days > 0 && (
                            <span className="ml-2 text-gray-500">({days} {days === 1 ? 'day' : 'days'})</span>
                          )}
                        </span>
                      ) : startDate ? (
                        format(new Date(startDate), "MMM dd, yyyy")
                      ) : (
                        "Select Dates"
                      )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
                    <Calendar
                    mode="range"
                    selected={{
                      from: startDate ? new Date(startDate) : undefined,
                      to: endDate ? new Date(endDate) : undefined,
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        field.onChange(range.from);
                      }
                      if (range?.to) {
                        form.setValue("endDate", range.to);
                      } else if (range?.from && !range?.to) {
                        // Clear end date if only start date is selected
                        // Don't clear endDate, keep the current value if only start date is selected
                        // form.setValue("endDate", undefined);
                      }
                    }}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md"
                  />
                  {startDate && endDate && days && days > 0 && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <p className={cn(
                        "text-sm",
                        days > 20 ? "text-red-600 font-semibold" : "text-gray-700"
                      )}>
                        <span className="font-semibold">Trip Duration:</span> {days} {days === 1 ? 'day' : 'days'}
                        {days > 20 && (
                          <span className="block mt-1 text-xs">⚠️ Maximum trip duration is 20 days</span>
                        )}
                      </p>
                    </div>
                  )}
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
          );
        }}
      />

      <div>
        <FormLabel className="text-black text-sm font-medium mb-3 block">
          Which of these travel themes best describes your dream getaway? (Optional)
        </FormLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {travelThemes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = selectedThemes.includes(theme.id);
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => toggleTheme(theme.id)}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-xs min-h-[80px] group",
                  isSelected
                    ? "text-white shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm"
                )}
                style={isSelected ? {backgroundColor: '#DC6B5C', borderColor: '#DC6B5C'} : {}}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  isSelected ? "text-white" : "text-gray-600 group-hover:text-gray-900",
                  isSelected && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] text-center leading-tight font-medium",
                  isSelected ? "text-white" : "text-gray-700"
                )}>
                  {theme.label}
                </span>
              </button>
            );
          })}
          
          {/* Display custom themes */}
          {customThemes.map((customTheme: {id: string, label: string}) => {
            const isSelected = selectedThemes.includes(customTheme.id);
            return (
              <button
                key={customTheme.id}
                type="button"
                onClick={() => toggleTheme(customTheme.id)}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-xs min-h-[80px] group",
                  isSelected
                    ? "text-white shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm"
                )}
                style={isSelected ? {backgroundColor: '#DC6B5C', borderColor: '#DC6B5C'} : {}}
              >
                <MapPin className={cn(
                  "h-5 w-5 transition-transform",
                  isSelected ? "text-white" : "text-gray-600 group-hover:text-gray-900",
                  isSelected && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] text-center leading-tight font-medium",
                  isSelected ? "text-white" : "text-gray-700"
                )}>
                  {customTheme.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Add Theme Section */}
        <div className="mt-3">
          {!showAddTheme ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddTheme(true)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs h-9"
            >
              <span className="mr-2 text-base">+</span>
              Add theme
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Enter custom theme name..."
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTheme.trim()) {
                    e.preventDefault();
                    addCustomTheme(customTheme.trim());
                    setCustomTheme('');
                    setShowAddTheme(false);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => {
                  if (customTheme.trim()) {
                    addCustomTheme(customTheme.trim());
                    setCustomTheme('');
                    setShowAddTheme(false);
                  }
                }}
                disabled={!customTheme.trim()}
                className="text-white text-xs h-9 px-4"
                style={{backgroundColor: '#DC6B5C'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a4d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC6B5C'}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddTheme(false);
                  setCustomTheme('');
                }}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs h-9 px-3"
              >
                Cancel
              </Button>
        </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 2: Travel Preferences
function Step2Content({ form }: { form: ReturnType<typeof useForm<FormData>> }) {
  return (
    <div className="space-y-5">
      <PreferenceSection
        title="What pace of travel do you prefer? (Optional)"
        options={travelPace}
        fieldName="travelPace"
        form={form}
      />

      <PreferenceSection
        title="What kind of weather do you prefer for your trip? (Optional)"
        options={weatherOptions}
        fieldName="weather"
        form={form}
      />

      <PreferenceSection
        title="What type of accommodation would you prefer? (Optional)"
        options={accommodationOptions}
        fieldName="accommodation"
        form={form}
      />

      <PreferenceSection
        title="What type of food would you like to enjoy during your trip? (Optional)"
        options={foodOptions}
        fieldName="food"
        form={form}
      />

      <PreferenceSection
        title="How would you like to travel from departure to destination (Optional)"
        options={transportOptions}
        fieldName="transport"
        form={form}
      />
    </div>
  );
}

interface PreferenceSectionProps {
  title: string;
  options: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }>;
  fieldName: string;
  form: ReturnType<typeof useForm<FormData>>;
}
function PreferenceSection({ title, options, fieldName, form }: PreferenceSectionProps) {
  return (
        <FormField
          control={form.control}
      name={fieldName as keyof FormData}
          render={({ field }) => (
            <FormItem>
          <FormLabel className="text-black text-sm font-medium mb-3 block">{title}</FormLabel>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = field.value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => form.setValue(fieldName as keyof FormData, isSelected ? "" : option.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 flex items-center gap-2 transition-all text-sm",
                    isSelected
                      ? "text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  )}
                  style={isSelected ? {backgroundColor: '#DC6B5C', borderColor: '#DC6B5C'} : {}}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
                <FormMessage />
              </FormItem>
            )}
          />
  );
}

// Step 3: Budget & Travel Companions
function Step3Content({ form }: { form: ReturnType<typeof useForm<FormData>> }) {
  const currency = form.watch("currency") || "INR";
  const budget = form.watch("budget") || 0;
  const currencyDetails =
    currencies.find((item) => item.code === currency) ||
    currencies.find((item) => item.code === "INR");
  const currencySymbol = currencyDetails?.symbol || currency;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="currency"
        render={({ field }) => {
          const selectedCurrency = currencies.find(c => c.code === (field.value || "INR"));
          return (
            <FormItem>
              <FormLabel className="text-black text-sm font-medium">
                Which currency would you like to use for your trip? (Optional)
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "INR"}>
              <FormControl>
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <div className="flex items-center gap-2 flex-1">
                      {selectedCurrency ? (
                        <>
                          <span className="text-lg">{selectedCurrency.flag}</span>
                          <span className="font-medium">{selectedCurrency.symbol}</span>
                          <span className="text-gray-500">{selectedCurrency.code}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Select currency</span>
                      )}
                    </div>
                  </SelectTrigger>
                </FormControl>
              <SelectContent className="bg-white border-gray-200 max-h-[300px]">
                {currencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code} className="text-black cursor-pointer pl-8">
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-lg flex-shrink-0">{curr.flag}</span>
                      <span className="font-medium flex-shrink-0">{curr.symbol}</span>
                      <span className="text-gray-600 flex-shrink-0">{curr.code}</span>
                      <span className="text-gray-400 ml-1">- {curr.name}</span>
        </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />

        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
            <FormLabel className="text-black text-sm font-medium">
              What is your estimated travel budget? ({currencySymbol} • {currency}) (Optional)
            </FormLabel>
            <div className="space-y-3">
              <Slider
                value={[budget]}
                onValueChange={(value) => {
                  field.onChange(value[0]);
                }}
                max={1000000}
                step={1000}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">{currencySymbol}</span>
                <Input
                  type="number"
                  value={budget === 0 ? "" : budget}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      field.onChange(0);
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue)) {
                        field.onChange(numValue);
                      }
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  placeholder={`e.g. ${currencySymbol} 1000`}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  min="0"
                />
              </div>
            </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passengers"
          render={() => {
            const currentAdults = form.watch("adults") || 1;
            const currentChildren = form.watch("children") || 0;
            const currentInfants = form.watch("infants") || 0;
            
            // Local function to update passenger field
            const updateField = () => {
              const adults = form.getValues("adults") || 0;
              const children = form.getValues("children") || 0;
              const infants = form.getValues("infants") || 0;
              
              let passengerText = "";
              if (adults > 0) {
                passengerText += `${adults} ${adults === 1 ? "adult" : "adults"}`;
              }
              if (children > 0) {
                if (passengerText) passengerText += ", ";
                passengerText += `${children} ${children === 1 ? "child" : "children"}`;
              }
              if (infants > 0) {
                if (passengerText) passengerText += ", ";
                passengerText += `${infants} ${infants === 1 ? "infant" : "infants"}`;
              }
              form.setValue("passengers", passengerText || "1 adult");
            };
            
            return (
              <FormItem>
                <FormLabel className="text-black text-sm font-medium">How many passengers? (Required)</FormLabel>
                <FormControl>
                  <PassengerSelector
                    adults={currentAdults}
                    // eslint-disable-next-line react/no-children-prop
                    children={currentChildren}
                    infants={currentInfants}
                    onAdultsChange={(value) => {
                      form.setValue("adults", value);
                      updateField();
                    }}
                    onChildrenChange={(value) => {
                      form.setValue("children", value);
                      updateField();
                    }}
                    onInfantsChange={(value) => {
                      form.setValue("infants", value);
                      updateField();
                    }}
                  />
                </FormControl>
              <FormMessage />
            </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
        name="additionalPreferences"
          render={({ field }) => (
            <FormItem>
            <FormLabel className="text-black text-sm font-medium">
              Any additional preferences or specific places/activities you&apos;d like to include? (Optional)
            </FormLabel>
              <FormControl>
              <Textarea
                {...field}
                placeholder="e.g., I want to visit the Eiffel Tower, go parasailing, or try local cooking classes..."
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 min-h-[100px]"
              />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
    </div>
  );
}

// Step 4: Feasibility Check
function Step4Content({ form }: { form: ReturnType<typeof useForm<FormData>> }) {
  const [currentStage, setCurrentStage] = useState(0);
  const formValues = form.getValues();
  
  // Extract trip details
  const destination = formValues.destination || "Your destination";
  const startDate = formValues.startDate ? format(new Date(formValues.startDate), "MMM dd, yyyy") : "";
  const endDate = formValues.endDate ? format(new Date(formValues.endDate), "MMM dd, yyyy") : "";
  const currencyCode = formValues.currency || "USD";
  const currencyMeta =
    currencies.find((item) => item.code === currencyCode) ||
    currencies.find((item) => item.code === "USD");
  const currencySymbol = currencyMeta?.symbol || currencyCode;
  const budgetDisplay = formValues.budget ? `${currencySymbol} ${formValues.budget.toLocaleString()}` : "Not specified";
  const travelThemes = formValues.travelThemes || [];
  const adults = formValues.adults || 1;
  const children = formValues.children || 0;
  const infants = formValues.infants || 0;
  
  // Calculate trip duration
  let tripDuration = 0;
  if (formValues.startDate && formValues.endDate) {
    const start = new Date(formValues.startDate);
    const end = new Date(formValues.endDate);
    tripDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Stages of analysis
  const stages = [
    { 
      label: "Analyzing destination", 
      icon: MapPin, 
      description: "Checking weather and attractions" 
    },
    { 
      label: "Validating dates", 
      icon: CalendarIconLucide, 
      description: "Calculating trip duration and best times" 
    },
    { 
      label: "Reviewing preferences", 
      icon: Heart, 
      description: "Matching themes and travel style" 
    },
    { 
      label: "Optimizing budget", 
      icon: DollarSign, 
      description: "Creating cost-effective recommendations" 
    },
    { 
      label: "Generating itinerary", 
      icon: Plane, 
      description: "Building your personalized plan" 
    },
  ];
  
  // Animate through stages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < 4) { // stages.length - 1 = 4
          return prev + 1;
        }
        return prev; // Keep on last stage
      });
    }, 2000); // Change stage every 2 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="relative">
            <div className="animate-spin h-8 w-8 border-[3px] border-t-transparent rounded-full" style={{borderColor: '#DC6B5C', borderTopColor: 'transparent'}} />
            <div className="absolute inset-0 animate-ping h-8 w-8 border rounded-full" style={{borderColor: 'rgba(220, 107, 92, 0.2)'}} />
          </div>
          <h2 className="text-2xl font-bold text-black">Creating Your Perfect Plan</h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 text-sm"
        >
          This usually takes 30-40 seconds. Please don&apos;t close this page.
        </motion.p>
      </div>
      
      {/* Trip Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6"
      >
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Your Trip Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Destination</p>
            <p className="text-base font-semibold text-black flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {destination.includes(",") ? destination.split(",")[0] : destination}
            </p>
          </div>
          {startDate && endDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Duration</p>
              <p className="text-base font-semibold text-black flex items-center gap-2">
                <CalendarIconLucide className="h-4 w-4" />
                {tripDuration} {tripDuration === 1 ? "day" : "days"}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">Dates</p>
            <p className="text-base font-semibold text-black">
              {startDate && endDate ? `${startDate} - ${endDate}` : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Budget</p>
            <p className="text-base font-semibold text-black flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600" />
              {budgetDisplay}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Travelers</p>
            <p className="text-base font-semibold text-black flex items-center gap-2">
              <Users className="h-4 w-4" />
              {adults} {adults === 1 ? "adult" : "adults"}
              {children > 0 && `, ${children} ${children === 1 ? "child" : "children"}`}
              {infants > 0 && `, ${infants} ${infants === 1 ? "infant" : "infants"}`}
            </p>
          </div>
          {travelThemes.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Themes</p>
              <p className="text-base font-semibold text-black">
                {travelThemes.slice(0, 2).join(", ")}
                {travelThemes.length > 2 && ` +${travelThemes.length - 2} more`}
              </p>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Progress Stages */}
      <div className="space-y-4 flex-1">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Processing Stages
        </h3>
        <AnimatePresence>
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStage;
            const isCompleted = index < currentStage;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-300
                  ${isActive 
                    ? "text-white shadow-lg" 
                    : isCompleted
                    ? "border-gray-300 bg-gray-50 text-gray-700"
                    : "border-gray-200 bg-white text-gray-400"
                  }
                `}
                style={isActive ? {backgroundColor: '#DC6B5C', borderColor: '#DC6B5C'} : {}}
              >
                {/* Icon */}
                <div className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full
                  ${isActive 
                    ? "bg-white" 
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-400"
                  }
                `}
                style={isActive ? {color: '#DC6B5C'} : {}}>
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-white"
                    >
                      ✓
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <p className={`
                    font-semibold text-sm
                    ${isActive ? "text-white" : isCompleted ? "text-gray-700" : "text-gray-400"}
                  `}>
                    {stage.label}
                  </p>
                  <p className={`
                    text-xs mt-0.5
                    ${isActive ? "text-white/80" : isCompleted ? "text-gray-500" : "text-gray-400"}
                  `}>
                    {stage.description}
                  </p>
                </div>
                
                {/* Progress indicator */}
                {isActive && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-0 left-0 h-0.5 bg-white/30"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <div className="text-amber-600 text-lg font-bold">ℹ</div>
          <div>
            <p className="text-amber-900 text-xs font-semibold mb-1">
              What we&apos;re doing
            </p>
            <p className="text-amber-800 text-xs leading-relaxed">
              We&apos;re analyzing your preferences, checking weather conditions, finding the best attractions, 
              and creating a personalized itinerary that matches your budget and travel style.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Passenger Selector Component
function PassengerSelector({
  adults,
  children,
  infants,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
}: {
  adults: number;
  children: number;
  infants: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onInfantsChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localAdults, setLocalAdults] = useState(adults);
  const [localChildren, setLocalChildren] = useState(children);
  const [localInfants, setLocalInfants] = useState(infants);

  useEffect(() => {
    setLocalAdults(adults);
    setLocalChildren(children);
    setLocalInfants(infants);
  }, [adults, children, infants]);

  const handleApply = () => {
    onAdultsChange(localAdults);
    onChildrenChange(localChildren);
    onInfantsChange(localInfants);
    setOpen(false);
  };

  const formatPassengerText = () => {
    // Use the actual form values (adults, children, infants) for display, not local state
    let text = "";
    if (adults > 0) {
      text += `${adults} ${adults === 1 ? "adult" : "adults"}`;
    }
    if (children > 0) {
      if (text) text += ", ";
      text += `${children} ${children === 1 ? "child" : "children"}`;
    }
    if (infants > 0) {
      if (text) text += ", ";
      text += `${infants} ${infants === 1 ? "infant" : "infants"}`;
    }
    return text || "Select passengers";
  };

  const maxInfants = localAdults; // Maximum 1 infant per adult

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal bg-white border-gray-300 text-black hover:bg-gray-50"
        >
          <Users className="mr-2 h-4 w-4" />
          {formatPassengerText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-xs sm:max-w-sm md:max-w-md p-0 bg-white border-gray-200 shadow-lg" align="start">
        <div className="p-4 space-y-4">
          {/* Adults */}
          <div className="space-y-2">
            <div>
              <h3 className="text-black font-semibold text-sm">Adults</h3>
              <p className="text-gray-500 text-xs">Age 12+</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLocalAdults(Math.max(1, localAdults - 1))}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={localAdults <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-12 h-8 flex items-center justify-center bg-gray-100 rounded text-black font-medium border border-gray-200">
                {localAdults}
              </div>
              <button
                type="button"
                onClick={() => setLocalAdults(localAdults + 1)}
                className="w-8 h-8 flex items-center justify-center rounded border-2 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                style={{borderColor: '#DC6B5C', color: '#DC6B5C'}}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="space-y-2">
            <div>
              <h3 className="text-black font-semibold text-sm">Children</h3>
              <p className="text-gray-500 text-xs">Age 2-11</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLocalChildren(Math.max(0, localChildren - 1))}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={localChildren <= 0}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-12 h-8 flex items-center justify-center bg-gray-100 rounded text-black font-medium border border-gray-200">
                {localChildren}
              </div>
              <button
                type="button"
                onClick={() => setLocalChildren(localChildren + 1)}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className="space-y-2">
            <div>
              <h3 className="text-black font-semibold text-sm">Infants</h3>
              <p className="text-gray-500 text-xs">Under 2</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLocalInfants(Math.max(0, localInfants - 1))}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={localInfants <= 0}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-12 h-8 flex items-center justify-center bg-gray-100 rounded text-black font-medium border border-gray-200">
                {localInfants}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (localInfants < maxInfants) {
                    setLocalInfants(localInfants + 1);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={localInfants >= maxInfants}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Note */}
          <p className="text-gray-500 text-xs pt-2 border-t border-gray-200">
            Note: Infants must be accompanied by an adult (maximum 1 infant per adult).
          </p>

          {/* Apply Button */}
            <Button
            type="button"
            onClick={handleApply}
            className="w-full text-white font-semibold rounded-lg py-2"
            style={{backgroundColor: '#ff6725'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a4d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC6B5C'}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
