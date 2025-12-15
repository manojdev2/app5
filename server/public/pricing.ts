"use strict";
"use server";

import { getLivePricingPlans } from "../admin/pricing";

export async function getPublicPricingPlans() {
  try {
    return await getLivePricingPlans();
  } catch (error) {
    // Return empty array on error to prevent page crashes
    return [];
  }
}

