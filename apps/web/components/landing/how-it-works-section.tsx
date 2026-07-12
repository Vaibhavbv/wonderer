"use client";

import { motion } from "framer-motion";
import { AtSign, MapPin, Users, Compass } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: AtSign,
    title: "Claim your handle",
    description: "Create your profile and start your living travel map. Your @handle is your passport.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "Add your trips",
    description: "Drop in photos and places. Moments cluster into trips and land on your map automatically.",
  },
  {
    number: "03",
    icon: Users,
    title: "Grow your following",
    description: "Share your map. Friends and creators follow you and watch every new journey unfold.",
  },
  {
    number: "04",
    icon: Compass,
    title: "Explore & get inspired",
    description: "Save places from journeys you love straight to your bucket list, and plan what's next.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <h2 className="font-heading text-4xl sm:text-5xl text-text-primary leading-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            From your first trip to a following that travels with you — in four steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <div className="text-6xl font-heading text-primary-100 mb-4">
                {step.number}
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center mb-4">
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-heading text-xl text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
