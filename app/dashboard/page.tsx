import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import PlansList from "@/components/features/plans-list";
import { getPlansByUser } from "@/server/plans";
import DashboardClient from "@/components/features/dashboard-client";

export default async function DashboardPage() {
  // Check authentication
  const user = await currentUser();
  
  // Redirect to home if not authenticated
  if (!user) {
    redirect("/");
  }

  const plans = await getPlansByUser();

  return (
    <main className="min-h-screen pt-16 pb-8 bg-gradient-to-b from-[#fafafa] via-white to-[#fafafa]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardClient>
          {/* Dashboard Header with Create Trip Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
                Dashboard
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Manage your travel plans and create new trips
              </p>
            </div>
            <Link href="/travel-planner" className="self-start">
              <button 
                className="btn-tripzy text-white px-4 sm:px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Plan a Trip
              </button>
            </Link>
          </div>

          {/* My Plans Section */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-black mb-4">
              My Plans
            </h2>
            <PlansList plans={plans} />
          </div>
        </DashboardClient>
      </div>
    </main>
  );
}
