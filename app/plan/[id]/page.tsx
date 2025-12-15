import Plan from "@/components/features/plan";
import { getPlan } from "@/server/plans";
import { notFound } from "next/navigation";

export default async function PlanPage({ params }: { params: { id: string } }) {
  const plan = await getPlan(params.id);
  
  if (!plan) {
    notFound();
  }
  
  return <Plan plan={plan} />;
}
