"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DashboardClientProps {
  children: ReactNode;
}

export default function DashboardClient({ children }: DashboardClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}









