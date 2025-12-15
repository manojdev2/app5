"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, ArrowLeft, Calendar } from "lucide-react";

interface PrivacyPageClientProps {
  pageContent: string | null;
}

export function PrivacyPageClient({ pageContent }: PrivacyPageClientProps) {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-12 h-12" style={{color: '#EE7B6C'}} />
              <h1 className="text-4xl md:text-6xl font-black">Privacy Policy</h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your privacy is our priority. Learn how we collect, use, and protect your personal information.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {pageContent ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'November 7, 2025'}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      {pageContent && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          dangerouslySetInnerHTML={{ __html: pageContent }}
        />
      )}
    </main>
  );
}

