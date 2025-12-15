"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPageBySlug, updatePage, type PageContentData, type PageSlug } from "@/server/admin/pages";
import { Loader2, Trash2, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";

const pageLabels: Record<PageSlug, string> = {
  about: "About Page",
  contact: "Contact Page",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
};

// Helper function to parse HTML content into structured data
function parseHTMLContent(content: string, pageSlug: PageSlug): Record<string, unknown> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  
  if (pageSlug === "about") {
    // Mission Section - first grid with 2 columns
    const missionGrid = Array.from(doc.querySelectorAll(".grid")).find((grid) => 
      grid.classList.contains("grid-cols-1") && grid.classList.contains("lg:grid-cols-2")
    );
    const missionHeading = missionGrid?.querySelector("h2")?.textContent?.trim() || "";
    const missionLeft = missionGrid?.querySelector("div:first-child");
    const missionParagraphs = missionLeft
      ? Array.from(missionLeft.querySelectorAll("p")).map((p) => p.textContent?.trim() || "").filter((p) => p)
      : [];
    const stats = missionGrid
      ? Array.from(missionGrid.querySelectorAll(".text-center")).map((stat) => {
          const number = stat.querySelector("h3")?.textContent?.trim() || "";
          const label = stat.querySelector("p")?.textContent?.trim() || "";
          return { number, label };
        }).filter((s) => s.number && s.label)
      : [];
    
    // Values Section
    const allH2s = Array.from(doc.querySelectorAll("h2"));
    const valuesH2 = allH2s.find((h) => h.textContent?.includes("Values"));
    const valuesHeading = valuesH2?.textContent?.trim() || "";
    const valuesDescription = valuesH2?.parentElement?.querySelector("p")?.textContent?.trim() || "";
    const valuesGrid = Array.from(doc.querySelectorAll(".grid")).find((grid) => 
      grid.classList.contains("grid-cols-1") && grid.classList.contains("md:grid-cols-3")
    );
    const valuesItems = valuesGrid
      ? Array.from(valuesGrid.querySelectorAll("div")).map((item) => {
          const title = item.querySelector("h3")?.textContent?.trim() || "";
          const description = item.querySelector("p")?.textContent?.trim() || "";
          return { title, description };
        }).filter((v) => v.title && v.description)
      : [];
    
    // Story Section
    const storyH2 = allH2s.find((h) => h.textContent?.includes("Story"));
    const storyHeading = storyH2?.textContent?.trim() || "";
    const storyContainer = storyH2?.closest("div");
    const storyParagraphs = storyContainer
      ? Array.from(storyContainer.querySelectorAll("p")).map((p) => p.textContent?.trim() || "").filter((p) => p)
      : [];
    
    return {
      mission: {
        heading: missionHeading,
        paragraphs: missionParagraphs.length > 0 ? missionParagraphs : [""],
        stats: stats.length > 0 ? stats : [],
      },
      values: {
        heading: valuesHeading,
        description: valuesDescription,
        items: valuesItems.length > 0 ? valuesItems : [{ title: "", description: "" }],
      },
      story: {
        heading: storyHeading,
        paragraphs: storyParagraphs.length > 0 ? storyParagraphs : [""],
      },
    };
  } else if (pageSlug === "contact") {
    // Message Section
    const allH2s = Array.from(doc.querySelectorAll("h2"));
    const messageH2 = allH2s.find((h) => h.textContent?.includes("Send us a Message"));
    const messageSection = messageH2?.closest("div");
    const messageHeading = messageH2?.textContent?.trim() || "";
    const messageParagraph = messageSection?.querySelector("p.text-lg")?.textContent?.trim() || "";
    const contactItems = messageSection
      ? Array.from(messageSection.querySelectorAll(".space-y-6 > div")).map((item) => {
          const title = item.querySelector("h3")?.textContent?.trim() || "";
          const contentPs = Array.from(item.querySelectorAll("p")).map((p) => p.textContent?.trim() || "").filter((p) => p);
          return { title, content: contentPs.join("\n") };
        }).filter((item) => item.title && item.content)
      : [];
    
    // Get in Touch Section
    const touchH2 = allH2s.find((h) => h.textContent?.includes("Get in Touch"));
    const touchSection = touchH2?.closest("div");
    const touchHeading = touchH2?.textContent?.trim() || "";
    const touchParagraph = touchSection?.querySelector("p.text-lg")?.textContent?.trim() || "";
    
    // FAQ Section
    const faqH2 = allH2s.find((h) => h.textContent?.includes("Quick Answers"));
    const faqHeading = faqH2?.textContent?.trim() || "";
    const faqDescription = faqH2?.nextElementSibling?.textContent?.trim() || "";
    const faqGrid = Array.from(doc.querySelectorAll(".grid")).find((grid) => 
      grid.classList.contains("grid-cols-1") && grid.classList.contains("md:grid-cols-2")
    );
    const faqs = faqGrid
      ? Array.from(faqGrid.querySelectorAll("div")).map((faq) => {
          const question = faq.querySelector("h3")?.textContent?.trim() || "";
          const answer = faq.querySelector("p")?.textContent?.trim() || "";
          return { question, answer };
        }).filter((f) => f.question && f.answer)
      : [];
    
    return {
      message: {
        heading: messageHeading,
        paragraph: messageParagraph,
        contactItems: contactItems.length > 0 ? contactItems : [],
      },
      touch: {
        heading: touchHeading,
        paragraph: touchParagraph,
      },
      faq: {
        heading: faqHeading,
        description: faqDescription,
        items: faqs.length > 0 ? faqs : [{ question: "", answer: "" }],
      },
    };
  } else {
    // For terms and privacy - extract overview section and main sections
    // Overview section (before the main content)
    const overviewSection = doc.querySelector("section.py-20:not(.bg-gray-50)");
    const overviewHeading = overviewSection?.querySelector("h2.text-3xl")?.textContent?.trim() || "";
    const overviewDescription = overviewSection?.querySelector("p.text-lg")?.textContent?.trim() || "";
    const overviewItems = overviewSection
      ? Array.from(overviewSection.querySelectorAll(".bg-gray-50.rounded-2xl")).map((item) => {
          const title = item.querySelector("h3")?.textContent?.trim() || "";
          const description = item.querySelector("p.text-gray-600")?.textContent?.trim() || "";
          return { title, description };
        }).filter((item) => item.title && item.description)
      : [];
    
    // Main sections with headings and content
    const sectionsContainer = doc.querySelector(".space-y-8");
    const sections = sectionsContainer
      ? Array.from(sectionsContainer.children)
          .filter((child) => child.tagName === "DIV" && child.querySelector("h2"))
          .map((section) => {
            const heading = section.querySelector("h2")?.textContent?.trim() || "";
            // Only get paragraphs from the content wrapper div, not nested ones
            const contentDiv = section.querySelector("div.text-gray-600");
            const paragraphs = contentDiv
              ? Array.from(contentDiv.querySelectorAll("p")).map((p) => p.textContent?.trim() || "").filter((p) => p)
              : [];
            const lists = contentDiv
              ? Array.from(contentDiv.querySelectorAll("ul")).map((ul) => {
                  return Array.from(ul.querySelectorAll("li")).map((li) => li.textContent?.trim() || "").filter((li) => li);
                }).filter((list) => list.length > 0)
              : [];
            return { heading, paragraphs, lists };
          })
          .filter((s) => s.heading || s.paragraphs.length > 0 || s.lists.length > 0)
      : [];
    
    return {
      overview: {
        heading: overviewHeading,
        description: overviewDescription,
        items: overviewItems.length > 0 ? overviewItems : [{ title: "", description: "" }],
      },
      sections: sections.length > 0 ? sections : [{ heading: "", paragraphs: [""], lists: [] }],
    };
  }
}

// Helper function to reconstruct HTML from structured data
function reconstructHTML(data: Record<string, unknown>, pageSlug: PageSlug): string {
  if (pageSlug === "about") {
    const mission = (data.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
    const values = (data.values as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
    const story = (data.story as { heading: string; paragraphs: string[] }) || { heading: "", paragraphs: [] };
    
    const statsHTML = mission.stats.map((stat) => `
        <div class="text-center">
          <h3 class="text-2xl font-bold text-black mb-2">${stat.number}</h3>
          <p class="text-gray-600">${stat.label}</p>
        </div>
      `).join("");
    
    const valuesHTML = values.items.map((item) => `
      <div class="bg-white rounded-2xl p-8 shadow-lg">
        <h3 class="text-xl font-bold text-black mb-4 text-center">${item.title}</h3>
        <p class="text-gray-600 text-center leading-relaxed">${item.description}</p>
      </div>
    `).join("");
    
    return `<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Mission Section -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    <div>
      <h2 class="text-3xl md:text-4xl font-black text-black mb-6">${mission.heading}</h2>
      ${mission.paragraphs.map((p) => `<p class="text-lg text-gray-600 mb-6 leading-relaxed">${p}</p>`).join("")}
    </div>
    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8">
      <div class="grid grid-cols-2 gap-6">
        ${statsHTML}
      </div>
    </div>
  </div>
  
  <!-- Values Section -->
  <div class="mt-20">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-black text-black mb-4">${values.heading}</h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        ${values.description}
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      ${valuesHTML}
    </div>
  </div>
  
  <!-- Story Section -->
  <div class="mt-20">
    <div class="text-center">
      <h2 class="text-3xl md:text-4xl font-black text-black mb-8">${story.heading}</h2>
      <div class="prose prose-lg max-w-none text-gray-600">
        ${story.paragraphs.map((p) => `<p class="mb-6">${p}</p>`).join("")}
      </div>
    </div>
  </div>
</div>`;
  } else if (pageSlug === "contact") {
    const message = (data.message as { heading: string; paragraph: string; contactItems: Array<{ title: string; content: string }> }) || { heading: "", paragraph: "", contactItems: [] };
    const touch = (data.touch as { heading: string; paragraph: string }) || { heading: "", paragraph: "" };
    const faq = (data.faq as { heading: string; description: string; items: Array<{ question: string; answer: string }> }) || { heading: "", description: "", items: [] };
    
    const contactHTML = message.contactItems.map((item) => {
      const lines = item.content.split("\n");
      return `
        <div>
          <h3 class="text-lg font-bold text-black mb-1">${item.title}</h3>
          ${lines.map((line) => {
            if (line.includes("hours") || line.includes("EST") || line.includes("All times")) {
              return `<p class="text-sm text-gray-500">${line}</p>`;
            }
            return `<p class="text-gray-600">${line}</p>`;
          }).join("")}
        </div>
      `;
    }).join("");
    
    const faqHTML = faq.items.map((item) => `
      <div class="bg-white rounded-xl p-6 shadow-lg">
        <h3 class="text-lg font-bold text-black mb-3">${item.question}</h3>
        <p class="text-gray-600">${item.answer}</p>
      </div>
    `).join("");
    
    return `<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <div>
      <h2 class="text-3xl font-black text-black mb-8">${message.heading}</h2>
      <p class="text-lg text-gray-600 mb-8">
        ${message.paragraph}
      </p>
      <div class="space-y-6">
        ${contactHTML}
      </div>
    </div>
    <div>
      <h2 class="text-3xl font-black text-black mb-8">${touch.heading}</h2>
      <p class="text-lg text-gray-600 mb-8 leading-relaxed">
        ${touch.paragraph}
      </p>
    </div>
  </div>
  
  <!-- FAQ Section -->
  <div class="mt-20">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-black text-black mb-4">${faq.heading}</h2>
      <p class="text-lg text-gray-600">
        ${faq.description}
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${faqHTML}
    </div>
  </div>
</div>`;
  } else {
    // For terms and privacy
    const overview = (data.overview as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
    const sections = (data.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [];
    
    // Overview section HTML
    const overviewItemsHTML = overview.items.map((item) => `
      <div class="bg-gray-50 rounded-2xl p-6 text-center">
        <h3 class="text-xl font-bold text-black mb-3">${item.title}</h3>
        <p class="text-gray-600">${item.description}</p>
      </div>
    `).join("");
    
    const overviewHTML = overview.heading || overview.description || overview.items.length > 0 ? `
      <section class="py-20">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-black text-black mb-6">${overview.heading}</h2>
            <p class="text-lg text-gray-600 leading-relaxed">
              ${overview.description}
            </p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            ${overviewItemsHTML}
          </div>
        </div>
      </section>
    ` : "";
    
    // Main sections HTML
    const sectionsHTML = sections.map((section) => {
      const paragraphsHTML = section.paragraphs.map((p) => `<p>${p}</p>`).join("");
      const listsHTML = section.lists.map((list) => `
        <ul class="list-disc pl-6 space-y-2">
          ${list.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      `).join("");
      return `
      <div>
        <h2 class="text-2xl font-bold text-black mb-4">${section.heading}</h2>
        <div class="text-gray-600 space-y-4">
          ${paragraphsHTML}
          ${listsHTML}
        </div>
      </div>
    `;
    }).join("");
    
    return `${overviewHTML}
<section class="py-20 bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="prose prose-lg max-w-none">
      <div class="bg-white rounded-2xl p-8 shadow-lg space-y-8">
        ${sectionsHTML}
      </div>
    </div>
  </div>
</section>`;
  }
}

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = (params.slug as string) || "";
  
  // Extract page slug from URL (remove "edit-" prefix if present)
  const pageSlug = slugParam.startsWith("edit-") 
    ? (slugParam.replace("edit-", "") as PageSlug)
    : (slugParam as PageSlug);
  
  const [page, setPage] = useState<PageContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [structuredData, setStructuredData] = useState<Record<string, unknown>>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (pageSlug && ["about", "contact", "terms", "privacy"].includes(pageSlug)) {
      loadPage();
    } else {
      router.push("/admin/pages");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSlug, router]);

  const loadPage = async () => {
    try {
      const pageData = await getPageBySlug(pageSlug);
      if (pageData) {
        setPage(pageData);
        setFormData({
          title: pageData.title,
          content: pageData.content,
        });
        // Parse HTML content into structured data
        try {
          const parsed = parseHTMLContent(pageData.content, pageSlug);
          // Ensure we have at least default structure
          if (pageSlug === "about") {
            if (!parsed.mission) parsed.mission = { heading: "", paragraphs: [""], stats: [] };
            if (!parsed.values) parsed.values = { heading: "", description: "", items: [{ title: "", description: "" }] };
            if (!parsed.story) parsed.story = { heading: "", paragraphs: [""] };
          } else if (pageSlug === "contact") {
            if (!parsed.message) parsed.message = { heading: "", paragraph: "", contactItems: [] };
            if (!parsed.touch) parsed.touch = { heading: "", paragraph: "" };
            if (!parsed.faq) parsed.faq = { heading: "", description: "", items: [{ question: "", answer: "" }] };
          } else {
            if (!parsed.overview) parsed.overview = { heading: "", description: "", items: [{ title: "", description: "" }] };
            if (!parsed.sections || (parsed.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>).length === 0) {
              parsed.sections = [{ heading: "", paragraphs: [""], lists: [] }];
            }
          }
          setStructuredData(parsed);
        } catch (parseError) {
          // If parsing fails, initialize with defaults
          console.error("Failed to parse HTML:", parseError);
          if (pageSlug === "about") {
            setStructuredData({ 
              mission: { heading: "", paragraphs: [""], stats: [] },
              values: { heading: "", description: "", items: [{ title: "", description: "" }] },
              story: { heading: "", paragraphs: [""] }
            });
          } else if (pageSlug === "contact") {
            setStructuredData({ 
              message: { heading: "", paragraph: "", contactItems: [] },
              touch: { heading: "", paragraph: "" },
              faq: { heading: "", description: "", items: [{ question: "", answer: "" }] }
            });
          } else {
            setStructuredData({ 
              overview: { heading: "", description: "", items: [{ title: "", description: "" }] },
              sections: [{ heading: "", paragraphs: [""], lists: [] }] 
            });
          }
        }
      } else {
        toast.error("Page not found");
        router.push("/admin/pages");
      }
    } catch (error) {
      toast.error("Failed to load page");
      console.error(error);
      router.push("/admin/pages");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Reconstruct HTML from structured data
    const reconstructedContent = reconstructHTML(structuredData, pageSlug);

    setProcessing(true);
    try {
      await updatePage(page._id, {
        title: formData.title,
        content: reconstructedContent,
      });
      toast.success("Page updated successfully");
      router.push("/admin/pages");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update page";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EE7B6C" }} />
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <div>
      <div className="mb-8 sticky top-0 bg-gray-50 z-10 pb-4 pt-2 -mt-2 -mx-6 px-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/admin/pages"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Pages</span>
          </Link>
        </div>
        <h1 className="text-3xl font-black text-black mb-2">Edit {pageLabels[pageSlug]}</h1>
        <p className="text-gray-600">Update the content for this page</p>
      </div>

      {!adminEnabled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> You are in demo mode. You can&apos;t change anything.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Page Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={!adminEnabled || processing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
            placeholder="Page title"
          />
        </div>

        {/* About Page Editor */}
        {pageSlug === "about" && (
          <div className="space-y-6">
            {/* Mission Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-black mb-4">Mission Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                  <input
                    type="text"
                    value={((structuredData.mission as { heading: string })?.heading) || ""}
                    onChange={(e) => {
                      const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                      setStructuredData({ ...structuredData, mission: { ...mission, heading: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Our Mission"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Paragraphs</label>
                  {(((structuredData.mission as { paragraphs: string[] })?.paragraphs) || []).map((para, idx) => (
                    <div key={idx} className="mb-3 flex gap-2">
                      <textarea
                        value={para}
                        onChange={(e) => {
                          const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                          const paragraphs = [...mission.paragraphs];
                          paragraphs[idx] = e.target.value;
                          setStructuredData({ ...structuredData, mission: { ...mission, paragraphs } });
                        }}
                        disabled={!adminEnabled || processing}
                        rows={3}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Enter paragraph text"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                          const paragraphs = [...mission.paragraphs];
                          paragraphs.splice(idx, 1);
                          setStructuredData({ ...structuredData, mission: { ...mission, paragraphs } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                      setStructuredData({ ...structuredData, mission: { ...mission, paragraphs: [...mission.paragraphs, ""] } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Paragraph
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Statistics</label>
                  {(((structuredData.mission as { stats: Array<{ number: string; label: string }> })?.stats) || []).map((stat, idx) => (
                    <div key={idx} className="mb-3 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={stat.number}
                        onChange={(e) => {
                          const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                          const stats = [...mission.stats];
                          stats[idx] = { ...stats[idx], number: e.target.value };
                          setStructuredData({ ...structuredData, mission: { ...mission, stats } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Number"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                          const stats = [...mission.stats];
                          stats[idx] = { ...stats[idx], label: e.target.value };
                          setStructuredData({ ...structuredData, mission: { ...mission, stats } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Label"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                          const stats = [...mission.stats];
                          stats.splice(idx, 1);
                          setStructuredData({ ...structuredData, mission: { ...mission, stats } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const mission = (structuredData.mission as { heading: string; paragraphs: string[]; stats: Array<{ number: string; label: string }> }) || { heading: "", paragraphs: [], stats: [] };
                      setStructuredData({ ...structuredData, mission: { ...mission, stats: [...mission.stats, { number: "", label: "" }] } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Statistic
                  </button>
                </div>
              </div>
            </div>

            {/* Values Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-black mb-4">Values Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                  <input
                    type="text"
                    value={((structuredData.values as { heading: string })?.heading) || ""}
                    onChange={(e) => {
                      const values = (structuredData.values as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, values: { ...values, heading: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Our Values"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={((structuredData.values as { description: string })?.description) || ""}
                    onChange={(e) => {
                      const values = (structuredData.values as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, values: { ...values, description: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Description text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Value Items</label>
                  {(((structuredData.values as { items: Array<{ title: string; description: string }> })?.items) || []).map((item, idx) => (
                    <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">Value {idx + 1}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const values = (structuredData.values as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                            const items = [...values.items];
                            items.splice(idx, 1);
                            setStructuredData({ ...structuredData, values: { ...values, items } });
                          }}
                          disabled={!adminEnabled || processing}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const values = (structuredData.values as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                          const items = [...values.items];
                          items[idx] = { ...items[idx], title: e.target.value };
                          setStructuredData({ ...structuredData, values: { ...values, items } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Title (e.g., Innovation)"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const values = (structuredData.values as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                          const items = [...values.items];
                          items[idx] = { ...items[idx], description: e.target.value };
                          setStructuredData({ ...structuredData, values: { ...values, items } });
                        }}
                        disabled={!adminEnabled || processing}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Description"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const values = (structuredData.values as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, values: { ...values, items: [...values.items, { title: "", description: "" }] } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Value Item
                  </button>
                </div>
              </div>
            </div>

            {/* Story Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-black mb-4">Story Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                  <input
                    type="text"
                    value={((structuredData.story as { heading: string })?.heading) || ""}
                    onChange={(e) => {
                      const story = (structuredData.story as { heading: string; paragraphs: string[] }) || { heading: "", paragraphs: [] };
                      setStructuredData({ ...structuredData, story: { ...story, heading: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Our Story"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Paragraphs</label>
                  {(((structuredData.story as { paragraphs: string[] })?.paragraphs) || []).map((para, idx) => (
                    <div key={idx} className="mb-3 flex gap-2">
                      <textarea
                        value={para}
                        onChange={(e) => {
                          const story = (structuredData.story as { heading: string; paragraphs: string[] }) || { heading: "", paragraphs: [] };
                          const paragraphs = [...story.paragraphs];
                          paragraphs[idx] = e.target.value;
                          setStructuredData({ ...structuredData, story: { ...story, paragraphs } });
                        }}
                        disabled={!adminEnabled || processing}
                        rows={3}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Enter paragraph text"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const story = (structuredData.story as { heading: string; paragraphs: string[] }) || { heading: "", paragraphs: [] };
                          const paragraphs = [...story.paragraphs];
                          paragraphs.splice(idx, 1);
                          setStructuredData({ ...structuredData, story: { ...story, paragraphs } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const story = (structuredData.story as { heading: string; paragraphs: string[] }) || { heading: "", paragraphs: [] };
                      setStructuredData({ ...structuredData, story: { ...story, paragraphs: [...story.paragraphs, ""] } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Paragraph
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Page Editor */}
        {pageSlug === "contact" && (
          <div className="space-y-6">
            {/* Message Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-black mb-4">Send us a Message Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                  <input
                    type="text"
                    value={((structuredData.message as { heading: string })?.heading) || ""}
                    onChange={(e) => {
                      const message = (structuredData.message as { heading: string; paragraph: string; contactItems: Array<{ title: string; content: string }> }) || { heading: "", paragraph: "", contactItems: [] };
                      setStructuredData({ ...structuredData, message: { ...message, heading: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Send us a Message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description Paragraph</label>
                  <textarea
                    value={((structuredData.message as { paragraph: string })?.paragraph) || ""}
                    onChange={(e) => {
                      const message = (structuredData.message as { heading: string; paragraph: string; contactItems: Array<{ title: string; content: string }> }) || { heading: "", paragraph: "", contactItems: [] };
                      setStructuredData({ ...structuredData, message: { ...message, paragraph: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Description text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Information</label>
                  {(((structuredData.message as { contactItems: Array<{ title: string; content: string }> })?.contactItems) || []).map((item, idx) => (
                    <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">Contact Item {idx + 1}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const message = (structuredData.message as { heading: string; paragraph: string; contactItems: Array<{ title: string; content: string }> }) || { heading: "", paragraph: "", contactItems: [] };
                            const items = [...message.contactItems];
                            items.splice(idx, 1);
                            setStructuredData({ ...structuredData, message: { ...message, contactItems: items } });
                          }}
                          disabled={!adminEnabled || processing}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const message = (structuredData.message as { heading: string; paragraph: string; contactItems: Array<{ title: string; content: string }> }) || { heading: "", paragraph: "", contactItems: [] };
                          const items = [...message.contactItems];
                          items[idx] = { ...items[idx], title: e.target.value };
                          setStructuredData({ ...structuredData, message: { ...message, contactItems: items } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Title (e.g., Email Us)"
                      />
                      <textarea
                        value={item.content}
                        onChange={(e) => {
                          const message = (structuredData.message as { heading: string; paragraph: string; contactItems: Array<{ title: string; content: string }> }) || { heading: "", paragraph: "", contactItems: [] };
                          const items = [...message.contactItems];
                          items[idx] = { ...items[idx], content: e.target.value };
                          setStructuredData({ ...structuredData, message: { ...message, contactItems: items } });
                        }}
                        disabled={!adminEnabled || processing}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Content (each line will be a separate paragraph)"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const message = (structuredData.message as { heading: string; paragraph: string; contactItems: Array<{ title: string; content: string }> }) || { heading: "", paragraph: "", contactItems: [] };
                      setStructuredData({ ...structuredData, message: { ...message, contactItems: [...message.contactItems, { title: "", content: "" }] } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Contact Item
                  </button>
                </div>
              </div>
            </div>

            {/* Get in Touch Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-black mb-4">Get in Touch Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                  <input
                    type="text"
                    value={((structuredData.touch as { heading: string })?.heading) || ""}
                    onChange={(e) => {
                      const touch = (structuredData.touch as { heading: string; paragraph: string }) || { heading: "", paragraph: "" };
                      setStructuredData({ ...structuredData, touch: { ...touch, heading: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Get in Touch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Paragraph</label>
                  <textarea
                    value={((structuredData.touch as { paragraph: string })?.paragraph) || ""}
                    onChange={(e) => {
                      const touch = (structuredData.touch as { heading: string; paragraph: string }) || { heading: "", paragraph: "" };
                      setStructuredData({ ...structuredData, touch: { ...touch, paragraph: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Description text"
                  />
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-black mb-4">Quick Answers Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                  <input
                    type="text"
                    value={((structuredData.faq as { heading: string })?.heading) || ""}
                    onChange={(e) => {
                      const faq = (structuredData.faq as { heading: string; description: string; items: Array<{ question: string; answer: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, faq: { ...faq, heading: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Quick Answers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={((structuredData.faq as { description: string })?.description) || ""}
                    onChange={(e) => {
                      const faq = (structuredData.faq as { heading: string; description: string; items: Array<{ question: string; answer: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, faq: { ...faq, description: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Description text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">FAQ Items</label>
                  {(((structuredData.faq as { items: Array<{ question: string; answer: string }> })?.items) || []).map((item, idx) => (
                    <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">FAQ {idx + 1}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const faq = (structuredData.faq as { heading: string; description: string; items: Array<{ question: string; answer: string }> }) || { heading: "", description: "", items: [] };
                            const items = [...faq.items];
                            items.splice(idx, 1);
                            setStructuredData({ ...structuredData, faq: { ...faq, items } });
                          }}
                          disabled={!adminEnabled || processing}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const faq = (structuredData.faq as { heading: string; description: string; items: Array<{ question: string; answer: string }> }) || { heading: "", description: "", items: [] };
                          const items = [...faq.items];
                          items[idx] = { ...items[idx], question: e.target.value };
                          setStructuredData({ ...structuredData, faq: { ...faq, items } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Question"
                      />
                      <textarea
                        value={item.answer}
                        onChange={(e) => {
                          const faq = (structuredData.faq as { heading: string; description: string; items: Array<{ question: string; answer: string }> }) || { heading: "", description: "", items: [] };
                          const items = [...faq.items];
                          items[idx] = { ...items[idx], answer: e.target.value };
                          setStructuredData({ ...structuredData, faq: { ...faq, items } });
                        }}
                        disabled={!adminEnabled || processing}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Answer"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const faq = (structuredData.faq as { heading: string; description: string; items: Array<{ question: string; answer: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, faq: { ...faq, items: [...faq.items, { question: "", answer: "" }] } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add FAQ Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms and Privacy Page Editor */}
        {(pageSlug === "terms" || pageSlug === "privacy") && (
          <div className="space-y-4">
            {/* Overview Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold text-black mb-4">Overview Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                  <input
                    type="text"
                    value={((structuredData.overview as { heading: string })?.heading) || ""}
                    onChange={(e) => {
                      const overview = (structuredData.overview as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, overview: { ...overview, heading: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Understanding Our Terms / Our Commitment to Your Privacy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={((structuredData.overview as { description: string })?.description) || ""}
                    onChange={(e) => {
                      const overview = (structuredData.overview as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, overview: { ...overview, description: e.target.value } });
                    }}
                    disabled={!adminEnabled || processing}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Description text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Feature Items</label>
                  {(((structuredData.overview as { items: Array<{ title: string; description: string }> })?.items) || []).map((item, idx) => (
                    <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">Item {idx + 1}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const overview = (structuredData.overview as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                            const items = [...overview.items];
                            items.splice(idx, 1);
                            setStructuredData({ ...structuredData, overview: { ...overview, items } });
                          }}
                          disabled={!adminEnabled || processing}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const overview = (structuredData.overview as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                          const items = [...overview.items];
                          items[idx] = { ...items[idx], title: e.target.value };
                          setStructuredData({ ...structuredData, overview: { ...overview, items } });
                        }}
                        disabled={!adminEnabled || processing}
                        className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Title (e.g., Fair Usage)"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const overview = (structuredData.overview as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                          const items = [...overview.items];
                          items[idx] = { ...items[idx], description: e.target.value };
                          setStructuredData({ ...structuredData, overview: { ...overview, items } });
                        }}
                        disabled={!adminEnabled || processing}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                        placeholder="Description"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const overview = (structuredData.overview as { heading: string; description: string; items: Array<{ title: string; description: string }> }) || { heading: "", description: "", items: [] };
                      setStructuredData({ ...structuredData, overview: { ...overview, items: [...overview.items, { title: "", description: "" }] } });
                    }}
                    disabled={!adminEnabled || processing}
                    className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature Item
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sections</label>
              {((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || []).map((section, sectionIdx) => (
                <div key={sectionIdx} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Section {sectionIdx + 1}</label>
                    <button
                      type="button"
                      onClick={() => {
                        const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                        sections.splice(sectionIdx, 1);
                        setStructuredData({ ...structuredData, sections });
                      }}
                      disabled={!adminEnabled || processing}
                      className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => {
                      const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                      sections[sectionIdx] = { ...sections[sectionIdx], heading: e.target.value };
                      setStructuredData({ ...structuredData, sections });
                    }}
                    disabled={!adminEnabled || processing}
                    className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Section heading"
                  />
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Paragraphs</label>
                    {section.paragraphs.map((para, paraIdx) => (
                      <div key={paraIdx} className="mb-2 flex gap-2">
                        <textarea
                          value={para}
                          onChange={(e) => {
                            const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                            sections[sectionIdx].paragraphs[paraIdx] = e.target.value;
                            setStructuredData({ ...structuredData, sections });
                          }}
                          disabled={!adminEnabled || processing}
                          rows={2}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                          placeholder="Paragraph text"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                            sections[sectionIdx].paragraphs.splice(paraIdx, 1);
                            setStructuredData({ ...structuredData, sections });
                          }}
                          disabled={!adminEnabled || processing}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                        sections[sectionIdx].paragraphs.push("");
                        setStructuredData({ ...structuredData, sections });
                      }}
                      disabled={!adminEnabled || processing}
                      className="flex items-center gap-2 text-xs text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Paragraph
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Lists</label>
                    {section.lists.map((list, listIdx) => (
                      <div key={listIdx} className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-600">List {listIdx + 1}</label>
                          <button
                            type="button"
                            onClick={() => {
                              const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                              sections[sectionIdx].lists.splice(listIdx, 1);
                              setStructuredData({ ...structuredData, sections });
                            }}
                            disabled={!adminEnabled || processing}
                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {list.map((item, itemIdx) => (
                          <div key={itemIdx} className="mb-2 flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                                sections[sectionIdx].lists[listIdx][itemIdx] = e.target.value;
                                setStructuredData({ ...structuredData, sections });
                              }}
                              disabled={!adminEnabled || processing}
                              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                              placeholder="List item"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                                sections[sectionIdx].lists[listIdx].splice(itemIdx, 1);
                                setStructuredData({ ...structuredData, sections });
                              }}
                              disabled={!adminEnabled || processing}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                            sections[sectionIdx].lists[listIdx].push("");
                            setStructuredData({ ...structuredData, sections });
                          }}
                          disabled={!adminEnabled || processing}
                          className="flex items-center gap-1 text-xs text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                          Add List Item
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || [])];
                        sections[sectionIdx].lists.push([]);
                        setStructuredData({ ...structuredData, sections });
                      }}
                      disabled={!adminEnabled || processing}
                      className="flex items-center gap-2 text-xs text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add List
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const sections = [...((structuredData.sections as Array<{ heading: string; paragraphs: string[]; lists: string[][] }>) || []), { heading: "", paragraphs: [""], lists: [] }];
                  setStructuredData({ ...structuredData, sections });
                }}
                disabled={!adminEnabled || processing}
                className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={processing || !adminEnabled}
            className="flex-1 py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#EE7B6C" }}
          >
            {processing ? "Updating..." : "Update Page"}
          </button>
          <Link
            href="/admin/pages"
            className="flex-1 py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

