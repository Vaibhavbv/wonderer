"use client";

import { motion } from "framer-motion";
import { Map, Camera, Wand2, Share2, ChevronRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-secondary-50" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <Wand2 className="w-4 h-4" />
            Now with AI-powered storytelling
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text-primary leading-[1.1]"
        >
          Your Travel Memories,
          <br />
          <span className="text-primary-500">Reimagined</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Transform your scattered photos and notes into cinematic, interactive travel stories. 
          Maps, timelines, and AI — all in one beautiful platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <SignInButton mode="modal">
            <Button size="lg" className="group">
              Start Your Journey
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </SignInButton>
          <SignInButton mode="modal">
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </SignInButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 flex items-center justify-center gap-8 sm:gap-16"
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary">47K+</div>
            <div className="text-sm text-text-tertiary">Travelers</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary">1.2M+</div>
            <div className="text-sm text-text-tertiary">Photos Mapped</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary">180+</div>
            <div className="text-sm text-text-tertiary">Countries</div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="w-5 h-5 text-text-tertiary" />
        </motion.div>
      </motion.div>
    </section>
  );
}
