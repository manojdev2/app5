"use strict";
"use server";

import { getLiveDestinations } from "../admin/destinations";

export async function getPublicDestinations() {
  try {
    return await getLiveDestinations();
  } catch (error) {
    // Return empty array on error to prevent page crashes
    return [];
  }
}

