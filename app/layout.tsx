import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConditionalHeader from "@/components/ui/conditional-header";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Toaster } from "sonner";
import { getPublicSiteSettings } from "@/server/public/site-settings";
import AdminInit from "@/components/admin-init";
import { ensureDefaultAdmin } from "@/lib/init-admin";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  
  // Ensure default admin is created on app startup
  ensureDefaultAdmin().catch(() => {
    // Silently fail - admin creation shouldn't block app startup
  });
  
  return {
    title: settings?.seoTitle || "",
    description: settings?.seoDescription || "",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ErrorBoundary>
            <AdminInit />
            <ConditionalHeader />
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
