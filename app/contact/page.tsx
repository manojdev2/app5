import { getPublicPage } from "@/server/public/pages";
import { ContactPageClient } from "./contact-client";

export default async function ContactPage() {
  const pageData = await getPublicPage("contact");

  return <ContactPageClient pageContent={pageData?.content || null} />;
}
