"use strict";
"use server";

import { getPageBySlug, type PageSlug } from "../admin/pages";

export async function getPublicPage(pageSlug: PageSlug) {
  try {
    return await getPageBySlug(pageSlug);
  } catch (error) {
    // Return null on error to allow fallback to hardcoded content
    return null;
  }
}

