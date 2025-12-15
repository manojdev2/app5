import { format } from "date-fns";
import { Plan } from "../shared/types";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

interface PlansListProps {
  plans: Plan[];
}

// Helper function to get currency symbol
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

// Helper function to get a destination image based on plan data
const getDestinationImage = (plan: Plan, index: number): string => {
  // Priority 1: Use Unsplash generated destination image
  if (plan.destinationImage) {
    return plan.destinationImage;
  }
  
  // Priority 2: Use first attraction image from places data
  if (plan.placesData?.attractions && plan.placesData.attractions.length > 0) {
    const firstAttraction = plan.placesData.attractions[0];
    if (firstAttraction.photoUrl) {
      return firstAttraction.photoUrl;
    }
  }
  
  // Priority 3: Use hotel image from places data
  if (plan.placesData?.hotels && plan.placesData.hotels.length > 0) {
    const firstHotel = plan.placesData.hotels[0];
    if (firstHotel.photoUrl) {
      return firstHotel.photoUrl;
    }
  }
  
  // Fallback: Use default images
  const defaultImages = [
    "/city-1.jpeg",
    "/city-2.jpeg",
    "/city-3.jpeg",
    "/city-4.jpeg",
  ];
  return defaultImages[index % defaultImages.length];
};

export default async function PlansList({ plans }: PlansListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan, index) => {
        const imageUrl = getDestinationImage(plan, index);
        const startDate = new Date(plan.startDate);
        const endDate = new Date(plan.endDate);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <Link key={plan.id} href={`/plan/${plan.id}`}>
            <div className="group relative h-[280px] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              {/* Image */}
              <div className="absolute inset-0">
                <Image
                  src={imageUrl}
                  alt="Travel destination"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-white/80 font-medium mb-1">
                      {plan.createdAt && format(new Date(plan.createdAt), "MMM dd, yyyy")}
                    </p>
                    {plan.destination && (
                      <h3 className="text-xl font-bold mb-1 line-clamp-1">
                        {plan.destination}
                        {plan.destinationCountry && (
                          <span className="text-white/80 font-normal">, {plan.destinationCountry}</span>
                        )}
                      </h3>
                    )}
                    <p className="text-sm text-white/90 font-medium">
                      {days} Day Trip
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex-shrink-0 ml-2">
                    <span className="text-sm font-semibold">{getCurrencySymbol(plan.currency)}{plan.budget.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{format(startDate, "MMM dd")} - {format(endDate, "MMM dd")}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
      
      {/* Create New Plan Card */}
      <Link href="/travel-planner">
        <div className="group relative h-[280px] rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-2 flex items-center justify-center">
          <div className="text-center">
            <Plus className="w-12 h-12 mx-auto text-gray-400 group-hover:text-gray-600 transition-colors mb-3" />
            <p className="text-gray-600 font-semibold">Create New Trip</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
