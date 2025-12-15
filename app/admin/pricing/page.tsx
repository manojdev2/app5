"use client";

import { useEffect, useState } from "react";
import {
  getAllPricingPlans,
  updatePricingPlan,
  type PricingPlanData,
} from "@/server/admin/pricing";
import { Edit, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlanData | null>(null);
  const [formData, setFormData] = useState({
    credits: "",
    plans: "",
    price: "",
    popular: false,
    isLive: true,
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await getAllPricingPlans();
      setPlans(data);
    } catch (error) {
      toast.error("Failed to load pricing plans");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: PricingPlanData) => {
    setEditingPlan(plan);
    setFormData({
      credits: plan.credits.toString(),
      plans: plan.plans.toString(),
      price: plan.price.toString(),
      popular: plan.popular,
      isLive: plan.isLive,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const credits = parseInt(formData.credits);
    const plans = parseInt(formData.plans);
    const price = parseFloat(formData.price);

    if (isNaN(credits) || credits <= 0) {
      toast.error("Please enter a valid credits amount");
      return;
    }
    if (isNaN(plans) || plans <= 0) {
      toast.error("Please enter a valid plans amount");
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setProcessing(true);
    try {
      await updatePricingPlan(editingPlan._id, {
        credits,
        plans,
        price,
        popular: formData.popular,
        isLive: formData.isLive,
      });
      toast.success("Pricing plan updated successfully");
      setShowEditModal(false);
      setEditingPlan(null);
      await loadPlans();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update pricing plan";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleLive = async (plan: PricingPlanData) => {
    try {
      await updatePricingPlan(plan._id, { isLive: !plan.isLive });
      toast.success(`Plan ${!plan.isLive ? "activated" : "deactivated"}`);
      await loadPlans();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update plan";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EE7B6C" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 sticky top-0 bg-gray-50 z-10 pb-4 pt-2 -mt-2 -mx-6 px-6">
        <h1 className="text-3xl font-black text-black mb-2">Pricing Management</h1>
        <p className="text-gray-600">Manage pricing plans for credit purchases</p>
      </div>

      {!adminEnabled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> You are in demo mode. You can&apos;t change anything.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`bg-white rounded-xl shadow-lg border-2 p-6 ${
              plan.popular ? "border-[#EE7B6C]" : "border-gray-200"
            }`}
          >
            {plan.popular && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-[#EE7B6C]/10 text-[#EE7B6C] text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h3 className="text-xl font-bold text-black">{plan.credits.toLocaleString()} Credits</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Ideal for ~{plan.plans} {plan.plans === 1 ? "plan" : "plans"}</p>
              <div className="mb-4">
                <span className="text-3xl font-black text-black">${plan.price.toFixed(2)}</span>
                <p className="text-xs text-gray-500 mt-1">
                  ≈ ${(plan.price / plan.plans).toFixed(2)} per plan
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => handleToggleLive(plan)}
                disabled={!adminEnabled}
                className={`px-3 py-1 rounded-full text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.isLive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {plan.isLive ? "Live" : "Hidden"}
              </button>
              <button
                onClick={() => handleEdit(plan)}
                disabled={!adminEnabled}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#EE7B6C" }}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Edit Pricing Plan</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Plan ID</p>
              <p className="font-semibold text-black">{editingPlan.planId}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credits</label>
                <input
                  type="number"
                  min="1"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter credits"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plans</label>
                <input
                  type="number"
                  min="1"
                  value={formData.plans}
                  onChange={(e) => setFormData({ ...formData, plans: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter number of plans"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter price"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  disabled={!adminEnabled || processing}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="popular" className="text-sm font-semibold text-gray-700">
                  Mark as Popular
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLive"
                  checked={formData.isLive}
                  onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                  disabled={!adminEnabled || processing}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isLive" className="text-sm font-semibold text-gray-700">
                  Live (visible on homepage)
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={processing || !adminEnabled}
                  className="flex-1 py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#EE7B6C" }}
                >
                  {processing ? "Updating..." : "Update Plan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlan(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
