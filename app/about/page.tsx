import { getPublicPage } from "@/server/public/pages";
import { AboutPageClient } from "./about-client";

export default async function AboutPage() {
  const pageData = await getPublicPage("about");

  return <AboutPageClient pageContent={pageData?.content || null} />;
}
