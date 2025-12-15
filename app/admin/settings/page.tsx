"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettings, type SiteSettingsData } from "@/server/admin/site-settings";
import { Mail, Lock, Loader2, Save, Search, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [processingEmail, setProcessingEmail] = useState(false);
  const [processingPassword, setProcessingPassword] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData | null>(null);
  const [processingSiteSettings, setProcessingSiteSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<{ navbar: boolean; footer: boolean }>({ navbar: false, footer: false });

  useEffect(() => {
    loadAdmin();
    loadSiteSettings();
  }, []);

  const loadAdmin = async () => {
    try {
      const response = await fetch("/api/admin/get-admin");
      if (response.ok) {
        const adminData = await response.json();
        setAdmin(adminData);
        if (adminData) {
          setEmailForm({ newEmail: adminData.email, currentPassword: "" });
        }
      } else {
        toast.error("Failed to load admin settings");
      }
    } catch (error) {
      toast.error("Failed to load admin settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    if (!emailForm.newEmail || !emailForm.currentPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setProcessingEmail(true);
    try {
      const response = await fetch("/api/admin/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: emailForm.newEmail,
          currentPassword: emailForm.currentPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Email updated successfully");
        setEmailForm({ ...emailForm, currentPassword: "" });
        await loadAdmin();
      } else {
        toast.error(data.error || "Failed to update email");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update email";
      toast.error(errorMessage);
    } finally {
      setProcessingEmail(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setProcessingPassword(true);
    try {
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Password updated successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update password";
      toast.error(errorMessage);
    } finally {
      setProcessingPassword(false);
    }
  };

  const loadSiteSettings = async () => {
    try {
      const settings = await getSiteSettings();
      setSiteSettings(settings);
    } catch (error) {
      toast.error("Failed to load site settings");
      console.error(error);
    }
  };

  const handleSiteSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;

    setProcessingSiteSettings(true);
    try {
      const success = await updateSiteSettings(siteSettings);
      if (success) {
        toast.success("Site settings updated successfully");
      } else {
        toast.error("Failed to update site settings");
      }
    } catch (error) {
      toast.error("Failed to update site settings");
      console.error(error);
    } finally {
      setProcessingSiteSettings(false);
    }
  };

  const handleLogoUpload = async (type: "navbar" | "footer", file: File) => {
    if (!siteSettings) return;

    setUploadingLogo({ ...uploadingLogo, [type]: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", type === "navbar" ? "navbarLogo" : "footerLogo");

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setSiteSettings({
        ...siteSettings,
        [type === "navbar" ? "navbarLogo" : "footerLogo"]: data.url,
      });
      toast.success(`${type === "navbar" ? "Navbar" : "Footer"} logo uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${type === "navbar" ? "navbar" : "footer"} logo`);
      console.error(error);
    } finally {
      setUploadingLogo({ ...uploadingLogo, [type]: false });
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
        <h1 className="text-3xl font-black text-black mb-2">Admin Settings</h1>
        <p className="text-gray-600">Manage your admin account settings</p>
      </div>

      {!adminEnabled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> You are in demo mode. You can&apos;t change anything.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Email Update */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Update Email</h2>
              <p className="text-sm text-gray-600">Change your admin email address</p>
            </div>
          </div>
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Email</label>
              <input
                type="email"
                value={admin?.email || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Email</label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                required
                disabled={!adminEnabled || processingEmail}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="new@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                required
                disabled={!adminEnabled || processingEmail}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter current password"
              />
            </div>
            <button
              type="submit"
              disabled={processingEmail || !adminEnabled}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#EE7B6C" }}
            >
              <Save className="w-4 h-4" />
              {processingEmail ? "Updating..." : "Update Email"}
            </button>
          </form>
        </div>

        {/* Password Update */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Update Password</h2>
              <p className="text-sm text-gray-600">Change your admin password</p>
            </div>
          </div>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                disabled={!adminEnabled || processingPassword}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                disabled={!adminEnabled || processingPassword}
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                disabled={!adminEnabled || processingPassword}
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              disabled={processingPassword || !adminEnabled}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#EE7B6C" }}
            >
              <Save className="w-4 h-4" />
              {processingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Site Settings */}
        {siteSettings && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Site Settings</h2>
                <p className="text-sm text-gray-600">Manage SEO, logos, and footer content</p>
              </div>
            </div>
            <form onSubmit={handleSiteSettingsUpdate} className="space-y-6">
              {/* SEO Settings */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-black">SEO Settings</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Title</label>
                    <input
                      type="text"
                      value={siteSettings.seoTitle}
                      onChange={(e) => setSiteSettings({ ...siteSettings, seoTitle: e.target.value })}
                      disabled={!adminEnabled || processingSiteSettings}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                      placeholder="Alto.trip - AI-Powered Travel Planning"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Description</label>
                    <textarea
                      value={siteSettings.seoDescription}
                      onChange={(e) => setSiteSettings({ ...siteSettings, seoDescription: e.target.value })}
                      disabled={!adminEnabled || processingSiteSettings}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                      placeholder="Plan your perfect trip with AI-powered travel planning..."
                    />
                  </div>
                </div>
              </div>

              {/* Logo Settings */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-black">Logo Settings</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Navbar Logo</label>
                    {siteSettings.navbarLogo && (
                      <div className="mb-2">
                        <Image
                          src={siteSettings.navbarLogo}
                          alt="Navbar Logo"
                          width={120}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload("navbar", file);
                      }}
                      disabled={!adminEnabled || processingSiteSettings || uploadingLogo.navbar}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 text-sm"
                    />
                    {uploadingLogo.navbar && (
                      <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Logo</label>
                    {siteSettings.footerLogo && (
                      <div className="mb-2">
                        <Image
                          src={siteSettings.footerLogo}
                          alt="Footer Logo"
                          width={120}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload("footer", file);
                      }}
                      disabled={!adminEnabled || processingSiteSettings || uploadingLogo.footer}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 text-sm"
                    />
                    {uploadingLogo.footer && (
                      <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Settings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-black">Footer Settings</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Description</label>
                    <textarea
                      value={siteSettings.footerDescription}
                      onChange={(e) => setSiteSettings({ ...siteSettings, footerDescription: e.target.value })}
                      disabled={!adminEnabled || processingSiteSettings}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                      placeholder="Your AI-powered travel companion..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Copyright</label>
                    <input
                      type="text"
                      value={siteSettings.footerCopyright}
                      onChange={(e) => setSiteSettings({ ...siteSettings, footerCopyright: e.target.value })}
                      disabled={!adminEnabled || processingSiteSettings}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                      placeholder="© 2025 Alto.trip. All rights reserved."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={processingSiteSettings || !adminEnabled}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#EE7B6C" }}
              >
                <Save className="w-4 h-4" />
                {processingSiteSettings ? "Saving..." : "Save Site Settings"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

