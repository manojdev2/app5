import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import PlansList from "@/components/features/plans-list";
import { getPlansByUser } from "@/server/plans";

export default async function MyPlansPage() {
  // Check authentication
  const user = await currentUser();
  
  // Redirect to home if not authenticated
  if (!user) {
    redirect("/");
  }

  const plans = await getPlansByUser();

  return (
    <main className="flex flex-col items-center justify-center p-24">
      <PlansList plans={plans} />
    </main>
  );
}
