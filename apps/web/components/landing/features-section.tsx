"use client";

import { motion } from "framer-motion";
import { Map, Camera, Wand2, Globe, Share2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: Map,
    title: "Interactive Maps",
    description: "Pin your photos to exact GPS coordinates. Watch animated routes unfold as you scroll through your journey.",
    color: "bg-primary-100 text-primary-600",
  },
  {
    icon: Camera,
    title: "Smart Scrapbook",
    description: "Drag-and-drop editor with magazine-grade templates. Auto-layout your photos into stunning compositions.",
    color: "bg-accent-100 text-accent-600",
  },
  {
    icon: Wand2,
    title: "AI Storytelling",
    description: "Generate narratives, captions, and titles from your photos. Translate stories to 20+ languages instantly.",
    color: "bg-secondary-100 text-secondary-600",
  },
  {
    icon: Globe,
    title: "3D Globe View",
    description: "Fly between destinations on a stunning 3D globe. Cinematic zoom transitions that feel like Google Earth.",
    color: "bg-primary-100 text-primary-600",
  },
  {
    icon: Share2,
    title: "Beautiful Sharing",
    description: "Share public links, embed widgets, or export to PDF, static sites, and MP4 videos.",
    color: "bg-accent-100 text-accent-600",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "End-to-end encryption for private trips. Full GDPR compliance with complete data export and deletion.",
    color: "bg-secondary-100 text-secondary-600",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
            Everything you need to tell your story
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            A complete toolkit for modern travelers who want more than just photo albums.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", feature.color)}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
