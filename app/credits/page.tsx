"use client";

import Link from "next/link";
import { ArrowLeft, Coins, Check } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getUserCredits } from "@/server/credits";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getPublicPricingPlans } from "@/server/public/pricing";

interface PricingPlan {
  planId: number;
  credits: number;
  price: number;
  plans: number;
  popular: boolean;
}

export default function CreditsPage() {
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [creditPackages, setCreditPackages] = useState<PricingPlan[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const [credits, packages] = await Promise.all([
          getUserCredits(),
          getPublicPricingPlans(),
        ]);
        setUserCredits(credits);
        setCreditPackages(packages);
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Check for success or error from Stripe redirect
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success) {
      // Refresh credits after successful payment
      fetchCredits();
      toast.success("Payment Successful!", {
        description: "Your credits have been added to your account. Happy planning!",
        duration: 5000,
      });
      // Remove query params from URL
      router.replace("/credits");
    } else if (canceled) {
      toast.info("Payment Canceled", {
        description: "Your payment was canceled. No charges were made.",
        duration: 4000,
      });
      router.replace("/credits");
    }
  }, [searchParams, router]);

  const handleBuyCredits = async (pkg: PricingPlan) => {
    try {
      setProcessing(pkg.planId.toString());
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: pkg.planId,
          credits: pkg.credits,
          price: pkg.price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        toast.loading("Redirecting to checkout...", {
          duration: 2000,
        });
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      console.error("Error initiating checkout:", error);
      const errorMessage = error instanceof Error ? error.message : "We couldn't start the checkout process. Please try again.";
      toast.error("Checkout Failed", {
        description: errorMessage,
        duration: 4000,
      });
      setProcessing(null);
    }
  };

  return (
    <main className="min-h-screen pt-16 pb-8 bg-gradient-to-b from-[#fafafa] via-white to-[#fafafa]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:gap-3">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 transition-colors text-sm font-medium w-fit"
            onMouseEnter={(e) => e.currentTarget.style.color = '#DC6B5C'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2">
              Buy Credits
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Purchase credits to generate your travel plans. Each plan costs 100 credits.
            </p>
          </div>
        </div>

        <SignedOut>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg text-center">
            <Coins className="h-14 w-14 sm:h-16 sm:w-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Sign In Required</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Please sign in to purchase credits and access your account.
            </p>
            <SignInButton mode="modal">
              <button 
                className="text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors"
                style={{backgroundColor: '#DC6B5C'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c55a4d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC6B5C'}
              >
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 sm:p-6 mb-8 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-white/90 text-xs sm:text-sm font-medium uppercase tracking-wide">Current Balance</p>
                <p className="text-3xl sm:text-4xl font-bold text-white">
                  {loading ? "Loading..." : userCredits.toLocaleString()}
                </p>
                <p className="text-white/80 text-sm">Credits Available</p>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Credit Packages */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-6">Choose a Credit Package</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creditPackages.length > 0 ? (
                creditPackages.map((pkg) => (
                <div
                  key={pkg.planId}
                  className={`relative bg-white border-2 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all ${
                    pkg.popular
                      ? "border-amber-500"
                      : "border-gray-200"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="mb-4">
                      <p className="text-3xl sm:text-4xl font-bold text-black mb-1">
                        {pkg.credits.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Credits</p>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-2xl sm:text-3xl font-bold text-black">${pkg.price}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ${(pkg.price / pkg.credits).toFixed(3)} per credit
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        ~{pkg.plans} {pkg.plans === 1 ? 'plan' : 'plans'}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleBuyCredits(pkg)}
                      disabled={processing === pkg.planId.toString()}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        pkg.popular
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                          : "text-white"
                      }`}
                      style={!pkg.popular ? {backgroundColor: '#DC6B5C'} : {}}
                      onMouseEnter={!pkg.popular ? (e) => e.currentTarget.style.backgroundColor = '#c55a4d' : undefined}
                      onMouseLeave={!pkg.popular ? (e) => e.currentTarget.style.backgroundColor = '#DC6B5C' : undefined}
                    >
                      {processing === pkg.planId.toString() ? "Processing..." : "Buy Now"}
                    </button>
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No pricing plans available at the moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="text-xl font-bold text-black mb-4">What You Get</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-black mb-1">AI-Powered Itineraries</p>
                  <p className="text-sm text-gray-600">
                    Generate detailed, personalized travel plans powered by advanced AI
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-black mb-1">Real-Time Weather Data</p>
                  <p className="text-sm text-gray-600">
                    Get current weather conditions and 5-day forecasts for your destination
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-black mb-1">Places & Attractions</p>
                  <p className="text-sm text-gray-600">
                    Discover top-rated restaurants, hotels, and attractions automatically
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-black mb-1">No Expiration</p>
                  <p className="text-sm text-gray-600">
                    Credits never expire - use them whenever you&apos;re ready to plan your next trip
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
            <p className="text-sm sm:text-base text-amber-900 leading-relaxed">
              <strong className="font-semibold">Note:</strong> Each travel plan generation costs 100 credits. 
              Credits are non-refundable but never expire. All purchases are secure and processed through our 
              trusted payment partners.
            </p>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}

