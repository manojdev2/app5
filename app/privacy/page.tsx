import { getPublicPage } from "@/server/public/pages";
import { PrivacyPageClient } from "./privacy-client";

export default async function PrivacyPage() {
  const pageData = await getPublicPage("privacy");

  return <PrivacyPageClient pageContent={pageData?.content || null} />;
}
