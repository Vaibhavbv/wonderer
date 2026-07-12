"use client";

import { motion } from "framer-motion";
import { Map, Users, Bookmark, Award, Film, Camera } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: Map,
    title: "Your travel-life map",
    description: "Every trip you've ever taken, connected on one living map that grows as you go.",
  },
  {
    icon: Users,
    title: "Follow your people",
    description: "Follow friends and creators, and watch their journeys unfold in your feed.",
  },
  {
    icon: Bookmark,
    title: "Save to bucket list",
    description: "Tap any place in someone's trip to drop it straight onto your own future map.",
  },
  {
    icon: Award,
    title: "Travel passport",
    description: "Countries, cities, and miles tracked automatically — a stamp for every place.",
  },
  {
    icon: Film,
    title: "Cinematic recaps",
    description: "Auto-generated recap videos of your journeys, ready to share anywhere.",
  },
  {
    icon: Camera,
    title: "Moments & stories",
    description: "Post where you are right now, or build a trip moment by moment.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <h2 className="font-heading text-4xl sm:text-5xl text-text-primary leading-tight">
            Everywhere you&apos;ve been, in one place
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Wanderverse turns your travels into a living map worth following — and worth showing off.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-500/15 text-primary-400">
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
