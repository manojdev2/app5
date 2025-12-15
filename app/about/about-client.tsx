"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Globe, ArrowLeft, Sparkles } from "lucide-react";

interface AboutPageClientProps {
  pageContent: string | null;
}

export function AboutPageClient({ pageContent }: AboutPageClientProps) {
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
              <Globe className="w-12 h-12" style={{color: '#EE7B6C'}} />
              <h1 className="text-4xl md:text-6xl font-black">About Alto.trip</h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Revolutionizing travel planning with the power of artificial intelligence, 
              making dream trips accessible to everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      {pageContent && (
        <section className="py-20">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: pageContent }}
          />
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who have discovered the magic of AI-powered trip planning.
            </p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 mx-auto"
                style={{backgroundColor: '#EE7B6C'}}
              >
                <Sparkles className="w-5 h-5" />
                Start Planning Your Trip
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

