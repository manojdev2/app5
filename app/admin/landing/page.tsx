"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getAllLandingPages, updateLandingPage, type LandingPageData, type LandingPageSection } from "@/server/admin/landing";
import { Loader2, Save, X, Plus, Trash2, Sparkles, MapPin, Calendar as CalendarIcon, Globe, Plane, Compass, Award, Heart, Users, CheckCircle, Zap, Shield, Star, TrendingUp, Clock, Navigation, Building, Camera, Coffee, Utensils, Hotel, Car, Train, Ship, Mountain, Sun, Moon, Cloud, Umbrella, ChevronDown, Mail, Phone, MessageCircle, Home, Briefcase } from "lucide-react";
import { toast } from "sonner";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";

const sectionLabels: Record<LandingPageSection, string> = {
  whyChoose: "Why Choose Alto.trip?",
  featuredExplorations: "Featured Explorations",
  chooseDestination: "Choose Your Destination",
  contactAdventure: "We'd love to build your next adventure",
};

export default function AdminLandingPage() {
  const [pages, setPages] = useState<LandingPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LandingPageSection>("whyChoose");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const data = await getAllLandingPages();
      setPages(data);
      
      // Initialize default structure if pages don't exist
      if (data.length === 0) {
        const defaultPages: LandingPageData[] = [
          {
            _id: "",
            section: "whyChoose",
            heading: "Why Choose Alto.trip?",
            description: "Experience the future of travel planning with our intelligent AI assistant",
            content: {
              features: [
                { icon: "Sparkles", title: "AI Powered Planning", description: "Experience the future of travel planning...", jsonFile: "" },
                { icon: "MapPin", title: "Perfect Itinerary", description: "Get perfectly crafted itineraries...", jsonFile: "" },
                { icon: "CalendarIcon", title: "Add to Calendar", description: "Seamlessly sync your travel itinerary...", jsonFile: "" },
                { icon: "Globe", title: "One Click Hotel Bookings", description: "Book the perfect accommodations...", jsonFile: "" },
              ],
            },
            images: [],
            jsonFiles: [],
            updatedAt: new Date(),
            createdAt: new Date(),
          },
          {
            _id: "",
            section: "featuredExplorations",
            heading: "Featured Explorations",
            description: "Discover unique travel experiences and hidden gems around the world",
            content: {
              explorations: [
                { name: "Australia", image: "", title: "Outback Adventures" },
                { name: "Finland", image: "", title: "Northern Lights" },
                { name: "France", image: "", title: "Romantic Escapes" },
                { name: "New Zealand", image: "", title: "Adventure Sports" },
                { name: "Norway", image: "", title: "Fjord Cruises" },
                { name: "Switzerland", image: "", title: "Alpine Hiking" },
              ],
            },
            images: [],
            jsonFiles: [],
            updatedAt: new Date(),
            createdAt: new Date(),
          },
          {
            _id: "",
            section: "chooseDestination",
            heading: "Choose Your Destination",
            description: "From tropical islands to bustling cities, from ancient cultures to modern marvels. Pick your perfect destination and let AI plan your dream trip!",
            content: {
              ctaText: "Start Planning Free",
              buttonText: "Plan Your Trip",
            },
            images: [],
            jsonFiles: [{ field: "animation", url: "" }],
            updatedAt: new Date(),
            createdAt: new Date(),
          },
          {
            _id: "",
            section: "contactAdventure",
            heading: "We'd love to build your next adventure",
            description: "Have questions about Alto.trip, need a custom proposal, or want to collaborate? Tell us a bit about your trip and our travel specialists will reach out within 24 hours.",
            content: {
              contactItems: [
                { title: "Email", detail: "support@Alto.trip.com", icon: "📧" },
                { title: "Phone / WhatsApp", detail: "+1 (415) 555-0199", icon: "📞" },
                { title: "Head Office", detail: "575 Market Street, 10th Floor, San Francisco, CA", icon: "📍" },
              ],
            },
            images: [],
            jsonFiles: [],
            updatedAt: new Date(),
            createdAt: new Date(),
          },
        ];
        setPages(defaultPages);
      }
    } catch (error) {
      toast.error("Failed to load landing pages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPage = (): LandingPageData | undefined => {
    return pages.find((p) => p.section === activeTab);
  };

  const handleSave = async () => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    setSaving(true);
    try {
      await updateLandingPage(currentPage.section, {
        heading: currentPage.heading,
        description: currentPage.description,
        content: currentPage.content,
        images: currentPage.images || [],
        jsonFiles: currentPage.jsonFiles || [],
      });
      toast.success("Landing page updated successfully");
      await loadPages();
    } catch (error) {
      toast.error("Failed to update landing page");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (field: string, file: File) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    setUploading({ ...uploading, [field]: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", field);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const updatedImages = [...(currentPage.images || [])];
      const existingIndex = updatedImages.findIndex((img) => img.field === field);
      
      if (existingIndex >= 0) {
        updatedImages[existingIndex] = { field, url: data.url };
      } else {
        updatedImages.push({ field, url: data.url });
      }

      setPages(
        pages.map((p) =>
          p.section === activeTab ? { ...p, images: updatedImages } : p
        )
      );
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setUploading({ ...uploading, [field]: false });
    }
  };

  const handleJsonUpload = async (field: string, file: File) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    setUploading({ ...uploading, [`json-${field}`]: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", field);

      const response = await fetch("/api/admin/upload-json", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const updatedJsonFiles = [...(currentPage.jsonFiles || [])];
      const existingIndex = updatedJsonFiles.findIndex((f) => f.field === field);
      
      if (existingIndex >= 0) {
        updatedJsonFiles[existingIndex] = { field, url: data.url };
      } else {
        updatedJsonFiles.push({ field, url: data.url });
      }

      setPages(
        pages.map((p) =>
          p.section === activeTab ? { ...p, jsonFiles: updatedJsonFiles } : p
        )
      );
      toast.success("JSON file uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload JSON file");
      console.error(error);
    } finally {
      setUploading({ ...uploading, [`json-${field}`]: false });
    }
  };

  const updatePageField = (field: string, value: unknown) => {
    setPages(
      pages.map((p) =>
        p.section === activeTab ? { ...p, [field]: value } : p
      )
    );
  };

  const updateContentField = (path: string, value: unknown) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const keys = path.split(".");
    const newContent = { ...currentPage.content };
    let current: Record<string, unknown> = newContent;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    updatePageField("content", newContent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EE7B6C" }} />
      </div>
    );
  }

  const currentPage = getCurrentPage();

  return (
    <div>
      <div className="mb-8 sticky top-0 bg-gray-50 z-10 pb-4 pt-2 -mt-2 -mx-6 px-6">
        <h1 className="text-3xl font-black text-black mb-2">Landing Page Management</h1>
        <p className="text-gray-600">Edit content for homepage sections</p>
      </div>

      {!adminEnabled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> You are in demo mode. You can&apos;t change anything.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {(["whyChoose", "featuredExplorations", "chooseDestination", "contactAdventure"] as LandingPageSection[]).map((section) => (
            <button
              key={section}
              onClick={() => setActiveTab(section)}
              className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === section
                  ? "border-[#EE7B6C] text-[#EE7B6C]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {sectionLabels[section]}
            </button>
          ))}
        </div>
      </div>

      {currentPage && (
        <div className="space-y-6">
          {/* Common Fields */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-black mb-4">Section Header</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                <input
                  type="text"
                  value={currentPage.heading}
                  onChange={(e) => updatePageField("heading", e.target.value)}
                  disabled={!adminEnabled || saving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Section heading"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={currentPage.description}
                  onChange={(e) => updatePageField("description", e.target.value)}
                  disabled={!adminEnabled || saving}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Section description"
                />
              </div>
            </div>
          </div>

          {/* Section-Specific Content */}
          {activeTab === "whyChoose" && (
            <WhyChooseEditor
              content={currentPage.content}
              jsonFiles={currentPage.jsonFiles || []}
              onUpdate={updateContentField}
              onJsonUpload={handleJsonUpload}
              onRemoveJsonFile={(field) => {
                const updatedJsonFiles = (currentPage.jsonFiles || []).filter((f) => f.field !== field);
                setPages(
                  pages.map((p) =>
                    p.section === activeTab ? { ...p, jsonFiles: updatedJsonFiles } : p
                  )
                );
              }}
              uploading={uploading}
              adminEnabled={adminEnabled}
              saving={saving}
            />
          )}

          {activeTab === "featuredExplorations" && (
            <FeaturedExplorationsEditor
              content={currentPage.content}
              images={currentPage.images || []}
              onUpdate={updateContentField}
              onImageUpload={handleImageUpload}
              uploading={uploading}
              adminEnabled={adminEnabled}
              saving={saving}
            />
          )}

          {activeTab === "chooseDestination" && (
            <ChooseDestinationEditor
              content={currentPage.content}
              jsonFiles={currentPage.jsonFiles || []}
              onUpdate={updateContentField}
              onJsonUpload={handleJsonUpload}
              onRemoveJsonFile={(field) => {
                const updatedJsonFiles = (currentPage.jsonFiles || []).filter((f) => f.field !== field);
                setPages(
                  pages.map((p) =>
                    p.section === activeTab ? { ...p, jsonFiles: updatedJsonFiles } : p
                  )
                );
              }}
              uploading={uploading}
              adminEnabled={adminEnabled}
              saving={saving}
            />
          )}

          {activeTab === "contactAdventure" && (
            <ContactAdventureEditor
              content={currentPage.content}
              onUpdate={updateContentField}
              adminEnabled={adminEnabled}
              saving={saving}
            />
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving || !adminEnabled}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#EE7B6C" }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Why Choose Editor Component
function WhyChooseEditor({
  content,
  jsonFiles,
  onUpdate,
  onJsonUpload,
  onRemoveJsonFile,
  uploading,
  adminEnabled,
  saving,
}: {
  content: Record<string, unknown>;
  jsonFiles: Array<{ field: string; url: string }>;
  onUpdate: (path: string, value: unknown) => void;
  onJsonUpload: (field: string, file: File) => void;
  onRemoveJsonFile: (field: string) => void;
  uploading: Record<string, boolean>;
  adminEnabled: boolean;
  saving: boolean;
}) {
  const features = (content.features as Array<{ icon: string; title: string; description: string; jsonFile: string }>) || [];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-black mb-4">Features</h3>
      <div className="space-y-6">
        {features.map((feature, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Feature {idx + 1}</label>
              <button
                type="button"
                onClick={() => {
                  const newFeatures = [...features];
                  newFeatures.splice(idx, 1);
                  onUpdate("features", newFeatures);
                }}
                disabled={!adminEnabled || saving}
                className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Icon</label>
                <IconPicker
                  value={feature.icon || ""}
                  onChange={(iconName) => {
                    const newFeatures = [...features];
                    newFeatures[idx] = { ...newFeatures[idx], icon: iconName };
                    onUpdate("features", newFeatures);
                  }}
                  disabled={!adminEnabled || saving}
                />
              </div>
              <input
                type="text"
                value={feature.title || ""}
                onChange={(e) => {
                  const newFeatures = [...features];
                  newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                  onUpdate("features", newFeatures);
                }}
                disabled={!adminEnabled || saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Title"
              />
              <textarea
                value={feature.description || ""}
                onChange={(e) => {
                  const newFeatures = [...features];
                  newFeatures[idx] = { ...newFeatures[idx], description: e.target.value };
                  onUpdate("features", newFeatures);
                }}
                disabled={!adminEnabled || saving}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Description"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Animation JSON File</label>
                {jsonFiles.find((f) => f.field === `feature-${idx}`)?.url ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-xs text-green-700 flex-1">
                        Current: {jsonFiles.find((f) => f.field === `feature-${idx}`)?.url}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveJsonFile(`feature-${idx}`)}
                        disabled={!adminEnabled || saving}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-600">Or upload a new file:</div>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onJsonUpload(`feature-${idx}`, file);
                    }}
                    disabled={!adminEnabled || saving || uploading[`json-feature-${idx}`]}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 text-sm"
                  />
                  {uploading[`json-feature-${idx}`] && (
                    <span className="text-xs text-blue-600 flex items-center">Uploading...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            onUpdate("features", [...features, { icon: "", title: "", description: "", jsonFile: "" }]);
          }}
          disabled={!adminEnabled || saving}
          className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </button>
      </div>
    </div>
  );
}

// Featured Explorations Editor Component
function FeaturedExplorationsEditor({
  content,
  images,
  onUpdate,
  onImageUpload,
  uploading,
  adminEnabled,
  saving,
}: {
  content: Record<string, unknown>;
  images: Array<{ field: string; url: string }>;
  onUpdate: (path: string, value: unknown) => void;
  onImageUpload: (field: string, file: File) => void;
  uploading: Record<string, boolean>;
  adminEnabled: boolean;
  saving: boolean;
}) {
  const explorations = (content.explorations as Array<{ name: string; image: string; title: string }>) || [];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-black mb-4">Explorations</h3>
      <div className="space-y-6">
        {explorations.map((exploration, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Exploration {idx + 1}</label>
              <button
                type="button"
                onClick={() => {
                  const newExplorations = [...explorations];
                  newExplorations.splice(idx, 1);
                  onUpdate("explorations", newExplorations);
                }}
                disabled={!adminEnabled || saving}
                className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={exploration.name || ""}
                onChange={(e) => {
                  const newExplorations = [...explorations];
                  newExplorations[idx] = { ...newExplorations[idx], name: e.target.value };
                  onUpdate("explorations", newExplorations);
                }}
                disabled={!adminEnabled || saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Name (e.g., Australia)"
              />
              <input
                type="text"
                value={exploration.title || ""}
                onChange={(e) => {
                  const newExplorations = [...explorations];
                  newExplorations[idx] = { ...newExplorations[idx], title: e.target.value };
                  onUpdate("explorations", newExplorations);
                }}
                disabled={!adminEnabled || saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Title (e.g., Outback Adventures)"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Image</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageUpload(`exploration-${idx}`, file);
                    }}
                    disabled={!adminEnabled || saving || uploading[`exploration-${idx}`]}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 text-sm"
                  />
                  {images.find((img) => img.field === `exploration-${idx}`)?.url && (
                    <span className="text-xs text-green-600 flex items-center">Uploaded</span>
                  )}
                </div>
                {images.find((img) => img.field === `exploration-${idx}`)?.url && (
                  <div className="mt-2 relative w-32 h-32">
                    <Image
                      src={images.find((img) => img.field === `exploration-${idx}`)?.url || ""}
                      alt="Preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            onUpdate("explorations", [...explorations, { name: "", image: "", title: "" }]);
          }}
          disabled={!adminEnabled || saving}
          className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Exploration
        </button>
      </div>
    </div>
  );
}

// Choose Destination Editor Component
function ChooseDestinationEditor({
  content,
  jsonFiles,
  onUpdate,
  onJsonUpload,
  onRemoveJsonFile,
  uploading,
  adminEnabled,
  saving,
}: {
  content: Record<string, unknown>;
  jsonFiles: Array<{ field: string; url: string }>;
  onUpdate: (path: string, value: unknown) => void;
  onJsonUpload: (field: string, file: File) => void;
  onRemoveJsonFile: (field: string) => void;
  uploading: Record<string, boolean>;
  adminEnabled: boolean;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">CTA Text</label>
        <input
          type="text"
          value={(content.ctaText as string) || ""}
          onChange={(e) => onUpdate("ctaText", e.target.value)}
          disabled={!adminEnabled || saving}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
          placeholder="e.g., Start Planning Free"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Button Text</label>
        <input
          type="text"
          value={(content.buttonText as string) || ""}
          onChange={(e) => onUpdate("buttonText", e.target.value)}
          disabled={!adminEnabled || saving}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
          placeholder="e.g., Plan Your Trip"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Animation JSON File</label>
        {jsonFiles.find((f) => f.field === "animation")?.url ? (
          <div className="space-y-2 mb-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-700 flex-1">
                Current: {jsonFiles.find((f) => f.field === "animation")?.url}
              </span>
              <button
                type="button"
                onClick={() => onRemoveJsonFile("animation")}
                disabled={!adminEnabled || saving}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-600">Or upload a new file:</div>
          </div>
        ) : null}
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onJsonUpload("animation", file);
            }}
            disabled={!adminEnabled || saving || uploading["json-animation"]}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 text-sm"
          />
          {uploading["json-animation"] && (
            <span className="text-xs text-blue-600 flex items-center">Uploading...</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Contact Adventure Editor Component
function ContactAdventureEditor({
  content,
  onUpdate,
  adminEnabled,
  saving,
}: {
  content: Record<string, unknown>;
  onUpdate: (path: string, value: unknown) => void;
  adminEnabled: boolean;
  saving: boolean;
}) {
  const contactItems = (content.contactItems as Array<{ title: string; detail: string; icon: string }>) || [];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-black mb-4">Contact Information</h3>
      <div className="space-y-4">
        {contactItems.map((item, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Contact Item {idx + 1}</label>
              <button
                type="button"
                onClick={() => {
                  const newItems = [...contactItems];
                  newItems.splice(idx, 1);
                  onUpdate("contactItems", newItems);
                }}
                disabled={!adminEnabled || saving}
                className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={item.title || ""}
                onChange={(e) => {
                  const newItems = [...contactItems];
                  newItems[idx] = { ...newItems[idx], title: e.target.value };
                  onUpdate("contactItems", newItems);
                }}
                disabled={!adminEnabled || saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Title (e.g., Email)"
              />
              <input
                type="text"
                value={item.detail || ""}
                onChange={(e) => {
                  const newItems = [...contactItems];
                  newItems[idx] = { ...newItems[idx], detail: e.target.value };
                  onUpdate("contactItems", newItems);
                }}
                disabled={!adminEnabled || saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Detail"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Icon</label>
                <IconPicker
                  value={item.icon || ""}
                  onChange={(iconName) => {
                    const newItems = [...contactItems];
                    newItems[idx] = { ...newItems[idx], icon: iconName };
                    onUpdate("contactItems", newItems);
                  }}
                  disabled={!adminEnabled || saving}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            onUpdate("contactItems", [...contactItems, { title: "", detail: "", icon: "" }]);
          }}
          disabled={!adminEnabled || saving}
          className="flex items-center gap-2 text-sm text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Contact Item
        </button>
      </div>
    </div>
  );
}

// Icon Picker Component
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  MapPin,
  CalendarIcon,
  Globe,
  Plane,
  Compass,
  Award,
  Heart,
  Users,
  CheckCircle,
  Zap,
  Shield,
  Star,
  TrendingUp,
  Clock,
  Navigation,
  Building,
  Camera,
  Coffee,
  Utensils,
  Hotel,
  Car,
  Train,
  Ship,
  Mountain,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Mail,
  Phone,
  MessageCircle,
  Home,
  Briefcase,
};

const iconNames = Object.keys(iconMap);

function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const SelectedIcon = value ? iconMap[value] : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between gap-2 bg-white"
      >
        <div className="flex items-center gap-3">
          {SelectedIcon ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SelectedIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{value}</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Select an icon</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            <div className="p-3 grid grid-cols-4 gap-2">
              {iconNames.map((iconName) => {
                const IconComponent = iconMap[iconName];
                const isSelected = value === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onChange(iconName);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      isSelected
                        ? "border-[#EE7B6C] bg-[#EE7B6C]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    title={iconName}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 block text-center truncate">{iconName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

