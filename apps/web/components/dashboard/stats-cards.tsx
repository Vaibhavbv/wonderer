"use client";

import { motion } from "framer-motion";
import { Map, Camera, Image as ImageIcon, Globe } from "lucide-react";

export interface DashboardStats {
  trips: number;
  photos: number;
  stories: number;
  countries: number;
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: "Trips", value: stats.trips, icon: Map, color: "bg-primary-500/15 text-primary-400" },
    { label: "Photos", value: stats.photos, icon: Camera, color: "bg-accent-500/15 text-accent-400" },
    { label: "Stories", value: stats.stories, icon: ImageIcon, color: "bg-secondary-500/15 text-secondary-300" },
    { label: "Countries", value: stats.countries, icon: Globe, color: "bg-primary-500/15 text-primary-400" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((stat, index) => (
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
              <div className="text-2xl font-bold text-text-primary">{stat.value.toLocaleString()}</div>
              <div className="text-sm text-text-tertiary">{stat.label}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
