"use client";

import { motion } from "framer-motion";
import { Upload, MapPin, Pen, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Import Your Media",
    description: "Upload photos from your camera roll, Google Photos, or Apple Photos. We auto-extract GPS, timestamps, and EXIF data.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "Map Your Route",
    description: "Watch your photos appear on an interactive map. Our AI reconstructs your travel route from photo metadata.",
  },
  {
    number: "03",
    icon: Pen,
    title: "Craft Your Story",
    description: "Use our drag-and-drop editor with AI-assisted text generation. Choose from cinematic scroll, magazine, or timeline layouts.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Share the World",
    description: "Publish with a beautiful public link, embed on your blog, or export to PDF, static website, or MP4 video.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">
            How it works
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            From raw photos to cinematic travel stories in four simple steps.
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
              <div className="text-6xl font-heading font-bold text-primary-100 mb-4">
                {step.number}
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center mb-4">
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
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
