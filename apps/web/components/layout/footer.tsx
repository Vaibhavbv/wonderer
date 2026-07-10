"use client";

import Link from "next/link";
import { Compass, Instagram, Twitter, Github, Mail } from "lucide-react";
import { GlowSurface } from "@/components/ui/glow-surface";
import { ParticleBackground } from "@/components/three/particle-background";

export function Footer() {
  return (
    <GlowSurface as="footer" className="bg-secondary-900 text-white/80" glowColor="255, 122, 100">
      <ParticleBackground color="#ff7a64" count={150} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-white">Wanderverse</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              Your travel memories, reimagined. Build immersive, cinematic stories from your journeys.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/discover" className="text-sm text-white/60 hover:text-white transition-colors">Discover</Link></li>
              <li><Link href="/destinations" className="text-sm text-white/60 hover:text-white transition-colors">Inspiration</Link></li>
              <li><Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Your trips</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Wanderverse. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-white/40 hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </GlowSurface>
  );
}
