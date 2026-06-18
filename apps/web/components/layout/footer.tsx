"use client";

import Link from "next/link";
import { Compass, Instagram, Twitter, Github, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary-900 text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
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

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-sm text-white/60 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/templates" className="text-sm text-white/60 hover:text-white transition-colors">Templates</Link></li>
              <li><Link href="/integrations" className="text-sm text-white/60 hover:text-white transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/help" className="text-sm text-white/60 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/api" className="text-sm text-white/60 hover:text-white transition-colors">API Docs</Link></li>
              <li><Link href="/changelog" className="text-sm text-white/60 hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/careers" className="text-sm text-white/60 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms</Link></li>
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
    </footer>
  );
}
