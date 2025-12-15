"use strict";
"use server";

import { getLiveFAQs } from "../admin/faqs";

export async function getPublicFAQs() {
  try {
    return await getLiveFAQs();
  } catch (error) {
    // Return empty array on error to prevent page crashes
    return [];
  }
}

