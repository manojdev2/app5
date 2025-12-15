 "use client";

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Plus, Coins, ChevronDown } from "lucide-react";
import { useState, useEffect, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getUserCredits } from "@/server/credits";
import { getPublicSiteSettings } from "@/server/public/site-settings";
import { cn } from "@/lib/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditMenuOpen, setCreditMenuOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [navbarLogo, setNavbarLogo] = useState<string>("");
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const isHome = pathname === "/";
  const { user, isLoaded } = useUser();

  const scrollToLandingSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getSectionHref = (sectionId: string) => (isHome ? `#${sectionId}` : `/#${sectionId}`);

  const createSectionClickHandler =
    (sectionId: string, options?: { closeMenu?: boolean }) =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (options?.closeMenu) {
        setMobileMenuOpen(false);
      }

      if (isHome) {
        event.preventDefault();
        scrollToLandingSection(sectionId);
      }
    };

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const settings = await getPublicSiteSettings();
        if (settings?.navbarLogo) {
          setNavbarLogo(settings.navbarLogo);
        }
      } catch (error) {
        console.error("Error fetching site settings:", error);
      }
    };

    fetchSiteSettings();
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      // Only fetch if user is loaded
      if (!isLoaded) {
        return;
      }

      // Only fetch if user is signed in
      if (!user) {
        setLoadingCredits(false);
        setUserCredits(0);
        return;
      }

      try {
        setLoadingCredits(true);
        const credits = await getUserCredits();
        setUserCredits(credits);
        console.log(`✅ Loaded credits for user: ${credits}`);
      } catch (error) {
        console.error("Error fetching credits:", error);
        setUserCredits(0);
      } finally {
        setLoadingCredits(false);
      }
    };

    fetchCredits();
  }, [user, isLoaded]); // Re-fetch when user changes (sign in/up)

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      {/* Solid white background with subtle blur */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md border-b border-gray-200/50 shadow-sm" />
      
      <nav className="relative max-w-[1600px] mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 sm:h-16 relative">
          {/* Left: Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors z-50 flex-shrink-0"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-6 w-6 text-black" />
          </button>

          {/* Center: Logo */}
          {navbarLogo && (
            <Link 
              href="/" 
              className={cn(
                "absolute left-1/2 transform -translate-x-1/2 z-10",
                isHome ? "block" : "hidden sm:block",
                isHome && "max-w-[calc(50%-60px)] sm:max-w-none"
              )}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-8 sm:h-10 w-auto"
              >
                <Image
                  src={navbarLogo}
                  alt="Tripizy Logo"
                  width={120}
                  height={40}
                  className="h-full w-auto object-contain"
                />
              </motion.div>
            </Link>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0 ml-auto">
            {!isDashboard && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <motion.button
                      className="hidden sm:flex btn-tripzy text-white px-6 py-2 rounded-full font-medium text-sm items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="h-4 w-4" />
                      Create
                    </motion.button>
                  </SignInButton>
                </SignedOut>
                <SignedOut>
                  <SignInButton mode="modal">
                    <motion.button
                      className={cn(
                        "sm:hidden inline-flex items-center rounded-full border border-gray-200 font-semibold text-gray-700 shadow-sm hover:bg-gray-100 transition-colors",
                        isHome ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-1.5 text-xs"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign In
                    </motion.button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <Link href="/dashboard">
                    <motion.button
                      className="hidden sm:flex btn-tripzy text-white px-6 py-2 rounded-full font-medium text-sm items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="h-4 w-4" />
                      Create
                    </motion.button>
                  </Link>
                </SignedIn>
              </>
            )}
            <SignedIn>
              <div className="hidden sm:flex items-center gap-4">
                <Popover open={creditMenuOpen} onOpenChange={setCreditMenuOpen}>
                  <PopoverTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 transition-all"
                    >
                      <Coins className="h-4 w-4" />
                      <span>{loadingCredits ? "..." : userCredits.toLocaleString()}</span>
                      <span className="text-xs opacity-90">Credits</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${creditMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>
                  </PopoverTrigger>
                  <PopoverContent 
                    align="end" 
                    className="w-80 p-0 bg-white border border-gray-200 rounded-xl shadow-xl"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-black">Credits Balance</h3>
                          <p className="text-sm text-gray-600">Available credits</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                          <Coins className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      {/* Balance Display */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4 border border-amber-200">
                        <p className="text-sm text-gray-600 mb-1">Total Credits</p>
                        <p className="text-3xl font-bold text-black">
                          {loadingCredits ? "Loading..." : userCredits.toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <Link 
                        href="/credits"
                        onClick={() => setCreditMenuOpen(false)}
                        className="block w-full"
                      >
                        <button className="w-full bg-black text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm">
                          Buy Credits
                        </button>
                      </Link>
                      
                      {/* Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                          Each plan generation costs 100 credits
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* User Button */}
                <UserButton />
              </div>
              <div className="flex sm:hidden items-center gap-1.5">
                {!isDashboard && (
                  <Link href="/dashboard">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "inline-flex items-center rounded-full bg-[#333] text-white font-semibold shadow-sm",
                        isHome ? "px-2 py-1.5 text-[10px] gap-0.5" : "px-3 py-1.5 text-xs gap-1"
                      )}
                    >
                      <Plus className={cn(isHome ? "w-3 h-3" : "w-3.5 h-3.5")} />
                      {!isHome && <span>Create</span>}
                    </motion.button>
                  </Link>
                )}
                <Link
                  href="/credits"
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full bg-white border border-gray-200 font-semibold text-gray-700 shadow-sm",
                    isHome ? "px-2 py-1.5 text-[10px]" : "px-2.5 py-1.5 text-xs gap-1"
                  )}
                >
                  <Coins className={cn("text-amber-500", isHome ? "w-3 h-3" : "w-3.5 h-3.5")} />
                  <span className={cn(isHome && "hidden")}>{loadingCredits ? "..." : userCredits.toLocaleString()}</span>
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: isHome ? "w-7 h-7" : "w-8 h-8"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>

        {/* Sidebar Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
              />
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-72 sm:w-80 bg-white rounded-r-3xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.05)] z-[130] overflow-y-auto"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
                    {navbarLogo ? (
                      <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                        <Image
                          src={navbarLogo}
                          alt="Tripizy Logo"
                          width={100}
                          height={32}
                          className="h-8 w-auto object-contain"
                        />
                      </Link>
                    ) : (
                      <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-2xl font-black text-black tracking-tight">Tripizy</span>
                      </Link>
                    )}
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-6 w-6 text-black" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-2 mb-8">
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Home
                    </Link>
                    
                    <SignedIn>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Plan a Trip
                      </Link>
                    </SignedIn>
                    <SignedOut>
                      <Link
                        href="/travel-planner"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Plan a Trip
                      </Link>
                    </SignedOut>

                    <Link
                      href={getSectionHref("destinations")}
                      onClick={createSectionClickHandler("destinations", { closeMenu: true })}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Destinations
                    </Link>

                    <Link
                      href={getSectionHref("how-it-works")}
                      onClick={createSectionClickHandler("how-it-works", { closeMenu: true })}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      How It Works
                    </Link>

                    <Link
                      href={getSectionHref("pricing")}
                      onClick={createSectionClickHandler("pricing", { closeMenu: true })}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pricing
                    </Link>

                    <SignedIn>
                      <Link
                        href="/my-plans"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-black font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        My Plans
                      </Link>
                    </SignedIn>
                  </nav>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Additional Links */}
                  <div className="space-y-2 mb-8">
                    <Link
                      href={getSectionHref("faq")}
                      onClick={createSectionClickHandler("faq", { closeMenu: true })}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      FAQ
                    </Link>

                    <Link
                      href={getSectionHref("contact")}
                      onClick={createSectionClickHandler("contact", { closeMenu: true })}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact Us
                    </Link>
                  </div>

                  {/* Auth Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <SignedOut>
                      <SignInButton mode="modal">
                        <button className="w-full bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                          Sign In
                        </button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                        <UserButton />
                        <span className="text-sm font-medium text-gray-700">Account</span>
                      </div>
                    </SignedIn>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
