"use client";

import { useEffect, useState } from "react";
import { getAllPages, type PageContentData, type PageSlug } from "@/server/admin/pages";
import { Edit, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";

const pageLabels: Record<PageSlug, string> = {
  about: "About Page",
  contact: "Contact Page",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
};

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageContentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const data = await getAllPages();
      setPages(data);
    } catch (error) {
      toast.error("Failed to load pages");
      console.error(error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-black text-black mb-2">Pages Management</h1>
        <p className="text-gray-600">Edit content for About, Contact, Terms, and Privacy pages</p>
      </div>

      {!adminEnabled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> You are in demo mode. You can&apos;t change anything.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(["about", "contact", "terms", "privacy"] as PageSlug[]).map((slug) => {
          const page = pages.find((p) => p.pageSlug === slug);
          return (
            <div
              key={slug}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#EE7B6C]/10 rounded-lg">
                    <FileText className="w-6 h-6" style={{ color: "#EE7B6C" }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">{pageLabels[slug]}</h3>
                    <p className="text-sm text-gray-600">/{slug}</p>
                  </div>
                </div>
              </div>
              {page && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                  <p className="text-sm font-semibold text-black">
                    {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "Never"}
                  </p>
                </div>
              )}
              <Link
                href={`/admin/pages/edit-${slug}`}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                  !adminEnabled || !page
                    ? "opacity-50 cursor-not-allowed bg-gray-400"
                    : "hover:opacity-90"
                }`}
                style={adminEnabled && page ? { backgroundColor: "#EE7B6C" } : {}}
              >
                <Edit className="w-4 h-4" />
                {page ? "Edit Page" : "Page Not Found"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
