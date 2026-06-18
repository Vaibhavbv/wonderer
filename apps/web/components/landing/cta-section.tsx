"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

export function CTASection() {
  return (
    <section className="py-24 bg-secondary-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Ready to tell your story?
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Join thousands of travelers who have transformed their journeys into immersive, shareable experiences.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton mode="modal">
              <Button size="lg" className="bg-primary-500 hover:bg-primary-600 group">
                Start For Free
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button variant="ghost" size="lg" className="text-white/80 hover:text-white hover:bg-white/10">
                View Example Story
              </Button>
            </SignInButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
