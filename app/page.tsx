"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ArrowRight, Sparkles, MapPin, Calendar as CalendarIcon, Users, Check, Globe, Plane, Compass, Award, ChevronLeft, ChevronRight, Heart, ChevronDown } from "lucide-react";
import Lottie from "lottie-react";
/* import travelerAnimation from "../public/Traveler.json"; */
import aiPlanningAnimation from "../public/road trip.json";
import perfectItineraryAnimation from "../public/Clock.json";
import calendarIntegrationAnimation from "../public/Journey.json";
import hotelBookingAnimation from "../public/Travel.json";
import travelAnimation from "../public/Travel.json";
import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState("South East Asia");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hideMobileHero, setHideMobileHero] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    tripType: "Leisure Vacation",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    message: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  //const [calendarOpen, setCalendarOpen] = useState(false);

  const creditPackages = [
    {
      id: 1,
      credits: 500,
      price: 9.99,
      plans: 5,
      popular: false,
    },
    {
      id: 2,
      credits: 1200,
      price: 19.99,
      plans: 12,
      popular: true,
    },
    {
      id: 3,
      credits: 2500,
      price: 39.99,
      plans: 25,
      popular: false,
    },
  ];

  // const handleContactInputChange =
  //   (field: keyof typeof contactForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  //     setContactForm((prev) => ({
  //       ...prev,
  //       [field]: event.target.value,
  //     }));
  //     if (contactSuccess) {
  //       setContactSuccess(false);
  //     }
  //   };

  // const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   if (contactSubmitting) return;
  //   setContactSubmitting(true);

  //   setTimeout(() => {
  //     setContactSubmitting(false);
  //     setContactSuccess(true);
  //     setContactForm({
  //       name: "",
  //       email: "",
  //       tripType: "Leisure Vacation",
  //       startDate: undefined,
  //       endDate: undefined,
  //       message: "",
  //     });
  //     toast.success("Message Sent Successfully!", {
  //       description: "Thank you for contacting us! We'll get back to you within 24 hours.",
  //       duration: 5000,
  //     });
  //   }, 800);
  // };

  // Remove white background from travel animation
  const transparentTravelAnimation = {
    ...travelAnimation,
    layers: travelAnimation.layers.filter((layer: { nm?: string }) => layer.nm !== "Shape Layer 1")
  };


  // Reset scroll position when filter changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [activeFilter]);

  useEffect(() => {
    const evaluateScreen = () => {
      if (typeof window === "undefined") {
        return;
      }
      const { innerWidth, innerHeight } = window;
      setHideMobileHero(innerWidth < 1024 && innerHeight < 1366);
    };

    evaluateScreen();
    window.addEventListener("resize", evaluateScreen);

    return () => {
      window.removeEventListener("resize", evaluateScreen);
    };
  }, []);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // All destinations with regional categorization
  const allDestinationsData = [
    // South East Asia
    { name: "Malaysia", image: "/malaysia.jpeg", description: "THE HIDDEN GEM OF ASIA", region: "South East Asia" },
    { name: "Bali", image: "/bali.jpeg", description: "CULTURAL PARADISE", region: "South East Asia" },
    { name: "Sri Lanka", image: "/sri-lanka.jpeg", description: "FALL IN LOVE WITH", region: "South East Asia" },
    { name: "Singapore", image: "/singapore.jpeg", description: "THE LION CITY", region: "South East Asia" },
    { name: "Japan", image: "/japan.jpeg", description: "LAND OF RISING SUN", region: "South East Asia" },
    
    // Europe
    { name: "Switzerland", image: "/switzerland.jpeg", description: "ALPINE PARADISE", region: "Europe" },
    { name: "Italy", image: "/italy.jpeg", description: "TIMELESS BEAUTY", region: "Europe" },
    { name: "France", image: "/france.jpeg", description: "ROMANCE & ART", region: "Europe" },
    { name: "Spain", image: "/spain.jpeg", description: "PASSION & CULTURE", region: "Europe" },
    { name: "Austria", image: "/austria.jpeg", description: "MUSIC & MOUNTAINS", region: "Europe" },
    
    // Middle East
    { name: "Dubai", image: "/dubai.jpeg", description: "LUXURY REDEFINED", region: "Middle East" },
    { name: "Qatar", image: "/qatar.jpeg", description: "DESERT LUXURY", region: "Middle East" },
    { name: "Bahrain", image: "/bahrain.jpeg", description: "PEARL OF THE GULF", region: "Middle East" },
    { name: "Saudi Arabia", image: "/saudi-arabia.jpeg", description: "ANCIENT HERITAGE", region: "Middle East" },
    { name: "Abu Dhabi", image: "/abu-dhabi.jpeg", description: "CULTURAL CAPITAL", region: "Middle East" },
    { name: "AlUla", image: "/alula.jpeg", description: "ARCHAEOLOGICAL WONDER", region: "Middle East" },
    
    // Best Of Scandinavia
    { name: "Norway", image: "/norway.jpeg", description: "FJORDS & LIGHTS", region: "Best Of Scandinavia" },
    { name: "Finland", image: "/finland.jpeg", description: "AURORA WILDERNESS", region: "Best Of Scandinavia" },
    { name: "Denmark", image: "/denmark.jpeg", description: "HYGGE & DESIGN", region: "Best Of Scandinavia" },
    { name: "Sweden", image: "/sweden.jpeg", description: "SCANDINAVIAN BEAUTY", region: "Best Of Scandinavia" },
    { name: "Iceland", image: "/iceland.jpeg", description: "FIRE & ICE", region: "Best Of Scandinavia" },
    
    // Oceania
    { name: "Australia", image: "/australia.jpeg", description: "OUTBACK & BEACHES", region: "Oceania" },
    { name: "Fiji", image: "/fiji.jpeg", description: "ISLAND PARADISE", region: "Oceania" },
    { name: "Sydney", image: "/sydney.jpeg", description: "HARBOR CITY", region: "Oceania" },
    { name: "Melbourne", image: "/melbourne.jpeg", description: "CULTURAL HUB", region: "Oceania" },
    { name: "Perth", image: "/perth.jpeg", description: "SUNSET COAST", region: "Oceania" },
    { name: "Queensland", image: "/queensland.jpeg", description: "GREAT BARRIER REEF", region: "Oceania" },
  ];

  // Filter destinations based on active filter
  const filteredDestinations = allDestinationsData.filter(destination => 
    destination.region === activeFilter
  );

  // Features array (currently unused but may be used in future)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _features = [
    {
      icon: Sparkles,
      title: "AI-Powered Planning",
      description: "Our advanced AI creates personalized itineraries based on your preferences, budget, and travel style."
    },
    {
      icon: MapPin,
      title: "Smart Recommendations",
      description: "Get curated suggestions for attractions, restaurants, and hidden gems tailored to your interests."
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Easily adjust your itinerary with drag-and-drop functionality and real-time updates."
    },
    {
      icon: Users,
      title: "Group Planning",
      description: "Plan trips for solo adventures, romantic getaways, family vacations, or group expeditions."
    }
  ];


  return (
    <main className="w-full min-h-screen bg-white" style={{ width: '100vw', overflow: 'hidden', padding: '0', margin: '0' }}>
      {/* Hero Section */}
      {/* <section className="relative w-full min-h-screen flex items-center" style={{ overflow: 'hidden', padding: '0', margin: '0' }}> */}
        {/* Lottie Background Animation - Full Screen */}
        {/* <div className="absolute inset-0 w-full h-full">
          <div 
            className="w-full h-full" 
            style={{ 
              width: '150vw', 
              height: '120vh', 
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Lottie
              animationData={travelerAnimation}
              loop={true}
              autoplay={true}
              className="w-full h-full"
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'cover',
                minWidth: '100%',
                minHeight: '100%'
              }}
            />
        </div>
        </div> */}


      {/* </section> */}
      <div id="lottie-background" className="w-screen min-h-[100vh] lg:h-[0vh] overflow-hidden relative flex items-center justify-center">

 <Image
      src="https://img.freepik.com/premium-photo/modern-banner-showcasing-minimalist-illustration-suitcase-airplane-iconic-travel-landmarks_1018465-4508.jpg?w=1480"
      alt="Travel Banner"
      width={1000}          // required for Next Image
      height={200}          // you can adjust height
      style={{
        width: "100%",      // makes it responsive like background-cover
        height: "100%",
        objectFit: "cover", 
        position:"absolute"
      }}
      priority              // loads faster on first paint
    />
  {/* Animated Corner Texts */}
  {/* Top Left Corner */}
            <motion.div
    initial={{ opacity: 0, x: -50, y: -50 }}
    animate={{ opacity: 1, x: 0, y: 0 }}
    transition={{ duration: 0.8, delay: 0.5 }}
    className="hidden lg:flex absolute top-24 left-8 z-10 bg-white/95 backdrop-blur-lg rounded-2xl px-5 py-4 shadow-2xl border border-white/60 items-center gap-3 max-w-xs"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
      <Sparkles className="w-6 h-6 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-black">Plan smarter</h3>
      <p className="text-gray-600 text-xs">Travel happier</p>
    </div>
            </motion.div>

  {/* Top Right Corner */}
            <motion.div
    initial={{ opacity: 0, x: 50, y: -50 }}
    animate={{ opacity: 1, x: 0, y: 0 }}
    transition={{ duration: 0.8, delay: 1.0 }}
    className="hidden lg:flex absolute top-24 right-8 z-10 bg-white/95 backdrop-blur-lg rounded-2xl px-5 py-4 shadow-2xl border border-white/60 items-center gap-3 max-w-xs"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
      <Heart className="w-6 h-6 text-white" />
              </div>
    <div>
      <h3 className="text-sm font-bold text-black">Effortless trips</h3>
      <p className="text-gray-600 text-xs">Better memories</p>
              </div>
            </motion.div>

  {/* Bottom Left Corner */}
  <motion.div
    initial={{ opacity: 0, x: -50, y: 50 }}
    animate={{ opacity: 1, x: 0, y: 0 }}
    transition={{ duration: 0.8, delay: 1.5 }}
    className="hidden lg:flex absolute bottom-32 left-8 z-10 bg-white/95 backdrop-blur-lg rounded-2xl px-5 py-4 shadow-2xl border border-white/60 items-center gap-3 max-w-xs"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
      <Compass className="w-6 h-6 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-black">More adventure</h3>
      <p className="text-gray-600 text-xs">Less planning</p>
    </div>
  </motion.div>

  {/* Bottom Right Corner */}
  <motion.div
    initial={{ opacity: 0, x: 50, y: 50 }}
    animate={{ opacity: 1, x: 0, y: 0 }}
    transition={{ duration: 0.8, delay: 2.0 }}
    className="hidden lg:flex absolute bottom-32 right-8 z-10 bg-white/95 backdrop-blur-lg rounded-2xl px-5 py-4 shadow-2xl border border-white/60 items-center gap-3 max-w-xs"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
      <Award className="w-6 h-6 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-black">Premium experience</h3>
      <p className="text-gray-600 text-xs">Luxury travel</p>
    </div>
  </motion.div>

  {/* Left-aligned Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 2.5 }}
    className="hidden lg:block absolute left-8 top-1/3 transform -translate-y-1/2 z-10"
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 3.0 }}
      className="flex flex-col sm:flex-row gap-4 items-start"
            >
              <SignedOut>
                <SignInButton mode="modal">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
            className="text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 group"
            style={{backgroundColor: '#333'}}
                  >
            <MapPin className="w-5 h-5 group-hover:bounce transition-transform" />
            Plan a Trip
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </SignInButton>
              </SignedOut>
              
              <SignedIn>
                <Link href="/travel-planner">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
            className="text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 group"
            style={{backgroundColor: '#ff6725'}}
                  >
            <MapPin className="w-5 h-5 group-hover:bounce transition-transform" />
            Plan a Trip
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </SignedIn>
            </motion.div>
            </motion.div>

          {/* Mobile & Tablet Hero Content */}
          <div className="relative z-20 flex w-full min-h-screen flex-col items-center justify-between gap-5 px-6 py-6 pb-24 text-center lg:hidden">
            {!hideMobileHero && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full max-w-sm bg-white/95 backdrop-blur-lg rounded-2xl px-5 py-4 shadow-2xl border border-white/60 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-black">Plan smarter</h3>
                  <p className="text-gray-600 text-xs">Travel happier</p>
                </div>
              </motion.div>
            )}

            {!hideMobileHero && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="max-w-md text-white"
              >
                <h1 className="text-2xl sm:text-3xl font-bold mb-3 drop-shadow-lg">Your AI travel concierge</h1>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                  Curated adventures, seamless itineraries, and effortless planning—powered by Alto.trip.
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute bottom-0 left-0 right-0 z-50 px-4 pt-4 pb-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm lg:relative lg:bg-transparent lg:backdrop-blur-none lg:px-0 lg:py-0 lg:z-auto lg:flex lg:w-full lg:max-w-sm lg:flex-col lg:gap-3"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex w-full max-w-sm mx-auto flex-col gap-3 lg:max-w-sm lg:mx-0">
                <SignedOut>
                  <SignInButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full text-white px-6 py-4 rounded-full font-semibold text-base shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3"
                      style={{ backgroundColor: '#ff6725' }}
                    >
                      <MapPin className="w-5 h-5" />
                      Plan a Trip
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <Link href="/travel-planner">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full text-white px-6 py-4 rounded-full font-semibold text-base shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3"
                      style={{ backgroundColor: '#ff6725' }}
                    >
                      <MapPin className="w-5 h-5" />
                      Plan a Trip
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>
                </SignedIn>
              </div>
            </motion.div>

            {!hideMobileHero && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="grid w-full max-w-md grid-cols-2 gap-3 text-left"
              >
                {[
                  { icon: Compass, title: "Curated routes", color: "from-orange-500 to-red-600" },
                  { icon: Heart, title: "Memory-first trips", color: "from-emerald-500 to-teal-600" },
                  { icon: Award, title: "Premium partners", color: "from-purple-500 to-pink-600" },
                  { icon: Globe, title: "Global coverage", color: "from-blue-500 to-indigo-600" },
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.1 + idx * 0.1 }}
                    className="flex items-center gap-3 bg-white/85 border border-white/60 rounded-xl px-3 py-3 shadow-lg"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{item.title}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
          </div>
          {/* All Destinations Showcase */}
          <section id="destinations" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header with Navigation */}
              <div className="flex items-center justify-between mb-8">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-2xl md:text-3xl font-bold text-black tracking-wide"
                >
                  ALL DESTINATIONS
                </motion.h2>
                
                {/* Navigation Arrows */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollLeft}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollRight}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
                {["South East Asia", "Europe", "Middle East", "Best Of Scandinavia", "Oceania"].map((filter) => (
                  <motion.button
                    key={filter}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap border-2 ${
                      activeFilter === filter
                        ? "text-white border-[#ff6725] shadow-lg"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                    style={activeFilter === filter ? {backgroundColor: '#ff6725'} : {}}
                  >
                    {filter}
                  </motion.button>
                ))}
              </div>

              {/* Horizontal Scrollable Destinations */}
              <div className="relative">
                  <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                {filteredDestinations.map((destination, index) => (
                    <motion.div
                      key={`${activeFilter}-${destination.name}`}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group cursor-pointer flex-shrink-0"
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 w-80 h-64">
                        <Image
                          src={destination.image}
                          alt={destination.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Destination Info */}
                        <div className="absolute bottom-6 left-6 text-white">
                          <p className="text-xs font-medium text-white/80 mb-1 tracking-wider">
                            {destination.description}
                          </p>
                          <h3 className="text-2xl font-bold">{destination.name}</h3>
                        </div>
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Plane className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                    </div>
                  </motion.div>
              </div>

              {/* CTA after destinations */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mt-16"
              >
                <SignedOut>
                  <SignInButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="text-white px-6 py-3 rounded-full font-medium text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto group"
                      style={{backgroundColor: '#ff6725'}}
                    >
                      <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Start Planning Your Trip
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <Link href="/travel-planner">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="text-white px-6 py-3 rounded-full font-medium text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto group"
                      style={{backgroundColor: '#ff6725'}}
                    >
                      <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Plan Your Trip Now
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                </SignedIn>
              </motion.div>
            </div>
          </section>

      {/* Features Section - Revamped with Alternating Layout */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-black text-black mb-4"
            >
              Why Choose Alto.trip?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Experience the future of travel planning with our intelligent AI assistant
            </motion.p>
          </div>

          {/* Feature 1: Left Content, Right Animation */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24"
          >
            {/* Content */}
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#333] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-black">AI Powered Planning</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Experience the future of travel planning with our intelligent AI assistant that creates personalized 
                itineraries tailored to your preferences, budget, and travel style in seconds.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Smart destination suggestions</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Personalized recommendations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Instant itinerary generation</span>
                </li>
              </ul>
            </div>
            
            {/* Animation/Visual */}
            <div className="relative">
              <div className="rounded-3xl h-80">
                <Lottie
                  animationData={aiPlanningAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Left Animation, Right Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24"
          >
            {/* Animation/Visual */}
            <div className="relative order-2 lg:order-1">
              <div className="rounded-3xl h-80">
                <Lottie
                  animationData={perfectItineraryAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="w-16 h-16 bg-gradient-to-br bg-[#333]     rounded-2xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-black">Perfect Itinerary</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Get perfectly crafted itineraries with optimal timing, seamless transitions, and the best attractions 
                tailored to your interests. Every detail is planned to perfection for your dream trip.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Optimized route planning</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Perfect timing coordination</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Seamless day-by-day flow</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 3: Left Content, Right Animation */}
              <motion.div
            initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24"
          >
            {/* Content */}
            <div className="space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-black">Add to Calendar</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Seamlessly sync your travel itinerary with your personal calendar. Never miss a flight, activity, 
                or reservation with automatic calendar integration and smart reminders.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">One-click calendar sync</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Smart reminders & alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Cross-platform compatibility</span>
                </li>
              </ul>
            </div>
            
            {/* Animation/Visual */}
            <div className="relative">
              <div className="rounded-3xl h-80">
                <Lottie
                  animationData={calendarIntegrationAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
                </div>
              </motion.div>

          {/* Feature 4: Left Animation, Right Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Animation/Visual */}
            <div className="relative order-2 lg:order-1">
              <div className="rounded-3xl h-80">
                <Lottie
                  animationData={hotelBookingAnimation}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="w-16 h-16 bg-[#333]  rounded-2xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-black">One Click Hotel Bookings</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Book the perfect accommodations instantly with our integrated booking system. Compare prices, 
                read reviews, and secure the best deals with just one click - no hassle, no redirects.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Instant booking confirmation</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Best price guarantee</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Integrated payment system</span>
                </li>
              </ul>
          </div>
          </motion.div>
        </div>
      </section>

          {/* Exploration Highlights */}
          <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-5xl font-black text-black mb-4"
                >
                  Featured Explorations
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-lg text-gray-600 max-w-2xl mx-auto"
                >
                  Discover unique travel experiences and hidden gems around the world
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { name: "Australia", image: "/exploration-australia.jpeg", title: "Outback Adventures" },
                  { name: "Finland", image: "/exploration-finland.jpeg", title: "Northern Lights" },
                  { name: "France", image: "/exploration-france.jpeg", title: "Romantic Escapes" },
                  { name: "New Zealand", image: "/exploration-new-zealand.jpeg", title: "Adventure Sports" },
                  { name: "Norway", image: "/exploration-norway.jpeg", title: "Fjord Cruises" },
                  { name: "Switzerland", image: "/exploration-switzerland.jpeg", title: "Alpine Hiking" },
                ].map((exploration, index) => (
                  <motion.div
                    key={exploration.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -10 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
                      <div className="aspect-[4/3] relative">
                        <Image
                          src={exploration.image}
                          alt={exploration.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 text-white">
                          <h3 className="text-xl font-bold mb-1">{exploration.title}</h3>
                          <p className="text-white/90">{exploration.name}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

      {/* Pricing Section */}
   {/*    <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-black text-black mb-4"
            >
              Simple, Credit-Based Pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-gray-600 max-w-3xl mx-auto"
            >
              Every plan generation costs 100 credits. Pick the bundle that matches how often you travel—credits never expire and can be used whenever inspiration strikes.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {creditPackages.map((pkg, index) => {
              const pricePerPlan = pkg.price / pkg.plans;
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative rounded-3xl border-2 bg-white p-8 shadow-lg ${
                    pkg.popular ? "border-[#ff6725] shadow-2xl" : "border-gray-200"
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute top-6 right-6 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-[#ff6725]/10 text-[#ff6725]">
                      Most Popular
                    </span>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-black mb-2">
                      {pkg.credits.toLocaleString()} Credits
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ideal for ~{pkg.plans} {pkg.plans === 1 ? "plan" : "plans"}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-black">${pkg.price.toFixed(2)}</span>
                    <p className="text-xs text-gray-500 mt-2">
                      ≈ ${pricePerPlan.toFixed(2)} per plan • ${ (pkg.price / pkg.credits).toFixed(3)} per credit
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Credits never expire—use them whenever you like</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Each AI-generated itinerary uses 100 credits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Includes weather insights, booking links, packing lists, and more</span>
                    </li>
                  </ul>

                  <Link
                    href="/credits"
                    className={`block text-center w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                      pkg.popular ? "bg-[#ff6725] text-white hover:bg-[#d96a5c]" : "bg-gray-900 text-white hover:bg-black"
                    }`}
                  >
                    Buy Credits
                  </Link>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Secure checkout via Stripe • Instant top-up
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content Section - Left Side */}
            <div className="text-center lg:text-left">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-black mb-6"
              >
                Choose Your Destination
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed"
              >
                From tropical islands to bustling cities, from ancient cultures to modern marvels.
                Pick your perfect destination and let AI plan your dream trip!
              </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
                className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4"
          >
            <SignedOut>
              <SignInButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 group"
                  style={{backgroundColor: '#ff6725'}}
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Start Planning Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <Link href="/travel-planner">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 group"
                  style={{backgroundColor: '#ff6725'}}
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Plan Your Trip
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </SignedIn>
          </motion.div>
            </div>

            {/* Animation Section - Right Side */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="w-full h-96 lg:h-[500px] flex items-center justify-center"
              >
                <div className="w-full h-full max-w-md lg:max-w-lg">
                  <Lottie
                    animationData={transparentTravelAnimation}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full"
                    style={{
                      background: 'transparent'
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-black text-black mb-4"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Everything you need to know about Alto.trip and how it works
            </motion.p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How does Alto.trip create personalized itineraries?",
                answer: "Alto.trip uses advanced AI algorithms to analyze your preferences, budget, travel dates, and interests. It then creates a customized itinerary that includes the best attractions, restaurants, and activities tailored specifically to your travel style."
              },
              {
                question: "Can I modify the AI-generated itinerary?",
                answer: "Absolutely! While our AI creates an optimized itinerary, you have full control to modify, add, or remove any activities. You can adjust timing, swap locations, and customize every aspect of your trip to match your preferences."
              },
              {
                question: "Does Alto.trip handle bookings for flights and hotels?",
                answer: "Yes! Alto.trip integrates with major booking platforms to help you secure the best deals on flights, hotels, and activities. You can compare prices and book directly through our platform with just a few clicks."
              },
              {
                question: "Is Alto.trip free to use?",
                answer: "Alto.trip offers both free and premium plans. The free plan includes basic itinerary creation, while premium plans offer advanced features like real-time updates, priority support, and exclusive deals."
              },
              {
                question: "Which destinations does Alto.trip support?",
                answer: "Alto.trip supports over 10,000 destinations worldwide, from popular tourist hotspots to hidden gems. Whether you're planning a city break, beach vacation, or adventure trip, we have you covered."
              },
              {
                question: "How far in advance should I plan my trip?",
                answer: "You can plan your trip anywhere from a few days to several months in advance. However, we recommend planning at least 2-4 weeks ahead for the best flight and accommodation deals, especially during peak travel seasons."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-bold text-black pr-4">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: openFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5" style={{color: '#ff6725'}} />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFAQ === index ? "auto" : 0,
                    opacity: openFAQ === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
    {/*   <section id="contact" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6725]/10 text-[#ff6725] text-xs font-semibold uppercase tracking-wide">
                Let&apos;s Talk
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-black">
                We’d love to build your next adventure
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Have questions about Alto.trip, need a custom proposal, or want to collaborate? Tell us a bit about your trip
                and our travel specialists will reach out within 24 hours.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Email",
                    detail: "support@Alto.trip.com",
                    icon: "📧"
                  },
                  {
                    title: "Phone / WhatsApp",
                    detail: "+1 (415) 555-0199",
                    icon: "📞"
                  },
                  {
                    title: "Head Office",
                    detail: "575 Market Street, 10th Floor, San Francisco, CA",
                    icon: "📍"
                  }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="text-2xl leading-none">{item.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{item.title}</h3>
                      <p className="text-gray-700 font-medium">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-900 rounded-3xl p-8 shadow-2xl text-white"
              onSubmit={handleContactSubmit}
            >
              <h3 className="text-2xl font-bold mb-6">Send us a message</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Sarah Johnson"
                    value={contactForm.name}
                    onChange={handleContactInputChange("name")}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff6725]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={contactForm.email}
                    onChange={handleContactInputChange("email")}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff6725]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Trip Type</label>
                    <select
                      value={contactForm.tripType}
                      onChange={handleContactInputChange("tripType")}
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6725] hover:border-gray-600 transition-colors cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="Leisure Vacation" className="bg-gray-800 text-white">Leisure Vacation</option>
                      <option value="Honeymoon" className="bg-gray-800 text-white">Honeymoon</option>
                      <option value="Family Adventure" className="bg-gray-800 text-white">Family Adventure</option>
                      <option value="Business Travel" className="bg-gray-800 text-white">Business Travel</option>
                      <option value="Group Expedition" className="bg-gray-800 text-white">Group Expedition</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Travel Date</label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-colors",
                            "flex items-center justify-start text-left font-normal",
                            "bg-gray-800 border-gray-700",
                            "text-white hover:bg-gray-700 hover:border-gray-600",
                            "focus:outline-none focus:ring-2 focus:ring-[#ff6725] focus:ring-offset-2 focus:ring-offset-gray-900",
                            !contactForm.startDate && !contactForm.endDate && "text-gray-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {contactForm.startDate && contactForm.endDate ? (
                              <>
                                {format(contactForm.startDate, "MMM dd, yyyy")} - {format(contactForm.endDate, "MMM dd, yyyy")}
                              </>
                            ) : contactForm.startDate ? (
                              format(contactForm.startDate, "MMM dd, yyyy")
                            ) : (
                              "Select dates"
                            )}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 z-[200]" align="start" side="bottom" sideOffset={4}>
                        <Calendar
                          mode="range"
                          selected={{
                            from: contactForm.startDate,
                            to: contactForm.endDate,
                          }}
                          onSelect={(range) => {
                            setContactForm((prev) => ({
                              ...prev,
                              startDate: range?.from,
                              endDate: range?.to,
                            }));
                            if (contactSuccess) {
                              setContactSuccess(false);
                            }
                            // Close popover when both dates are selected
                            if (range?.from && range?.to) {
                              setCalendarOpen(false);
                            }
                          }}
                          numberOfMonths={1}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="rounded-md"
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium text-white",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white border-gray-600 hover:bg-gray-700",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-gray-400 rounded-md w-8 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                            day: "h-8 w-8 p-0 font-normal text-white hover:bg-gray-700 aria-selected:opacity-100",
                            day_range_start: "day-range-start",
                            day_range_end: "day-range-end",
                            day_selected: "bg-[#ff6725] text-white hover:bg-[#d96a5c] focus:bg-[#ff6725] focus:text-white",
                            day_today: "bg-gray-700 text-white",
                            day_outside: "text-gray-500 opacity-50 aria-selected:bg-gray-700/50 aria-selected:text-gray-300 aria-selected:opacity-30",
                            day_disabled: "text-gray-600 opacity-50",
                            day_range_middle: "aria-selected:bg-[#ff6725]/30 aria-selected:text-white",
                            day_hidden: "invisible",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your dream destination and preferences..."
                    value={contactForm.message}
                    onChange={handleContactInputChange("message")}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff6725] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full py-3 rounded-xl bg-[#ff6725] hover:bg-[#d96a5c] transition-colors font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {contactSubmitting ? "Sending..." : "Submit Request"}
                </button>
                {contactSuccess ? (
                  <p className="text-sm text-green-400 text-center">
                    Thank you! Our team will get back to you within 24 hours.
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 text-center">
                  By submitting, you agree to receive updates from Alto.trip. We respect your privacy.
                  </p>
                )}
              </div>
            </motion.form>
          </div>
        </div>
      </section>
 */}
      {/* Footer Section */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            {/* Left Side - Brand */}
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-8 h-8" style={{color: '#ff6725'}} />
                <h3 className="text-2xl font-black">Alto.trip</h3>
              </div>
              <p className="text-gray-400 max-w-sm">
                Your AI-powered travel companion for creating unforgettable journeys.
              </p>
            </div>

            {/* Right Side - Links */}
            <div className="flex flex-wrap gap-8">
              {[
                { name: 'About', href: '/about' },
                { name: 'Contact', href: '#contact', scrollId: 'contact' },
                { name: 'Privacy', href: '/privacy' },
                { name: 'Terms', href: '/terms' }
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={link.scrollId ? (event) => {
                    event.preventDefault();
                    scrollToSection(link.scrollId!);
                  } : undefined}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2025 Alto.trip by krossark. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Made with ❤️ for travelers worldwide
            </p>
          </div>
        </div>
      </footer>

      <style jsx> {`
        #lottie-background > div > svg {
          transform: scale(1.2) !important;
        }
      `}
    </style>
    </main>
  );
}