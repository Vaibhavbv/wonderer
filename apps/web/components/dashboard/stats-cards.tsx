"use client";

import { motion } from "framer-motion";
import { Map, Camera, Image, Globe } from "lucide-react";

const stats = [
  { label: "Trips", value: "12", icon: Map, color: "bg-primary-100 text-primary-600" },
  { label: "Photos", value: "1,247", icon: Camera, color: "bg-accent-100 text-accent-600" },
  { label: "Stories", value: "8", icon: Image, color: "bg-secondary-100 text-secondary-600" },
  { label: "Countries", value: "23", icon: Globe, color: "bg-primary-100 text-primary-600" },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="bg-surface border border-border rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-sm text-text-tertiary">{stat.label}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
