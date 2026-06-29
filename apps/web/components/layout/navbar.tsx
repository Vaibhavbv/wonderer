"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Compass, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMyUsername } from "@/lib/use-my-username";

export function Navbar() {
  const { isSignedIn } = useUser();
  const username = useMyUsername();
  const profileHref = username ? `/profiles/${username}` : "/dashboard";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center transition-transform group-hover:scale-110">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-text-primary">
              Wanderverse
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-text-secondary hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link href="/discover" className="text-sm font-medium text-text-secondary hover:text-primary-600 transition-colors">
              Discover
            </Link>
            <Link href="/destinations" className="text-sm font-medium text-text-secondary hover:text-primary-600 transition-colors">
              Destinations
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href={profileHref}>
                  <Button variant="ghost" size="sm">Profile</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button size="sm">Get Started</Button>
                </SignInButton>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-md text-text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block text-base font-medium text-text-secondary" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link href="/discover" className="block text-base font-medium text-text-secondary" onClick={() => setMobileOpen(false)}>
              Discover
            </Link>
            <Link href="/destinations" className="block text-base font-medium text-text-secondary" onClick={() => setMobileOpen(false)}>
              Destinations
            </Link>
            <div className="pt-3 border-t border-border flex gap-3">
              {isSignedIn ? (
                <>
                  <Link href={profileHref} className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" fullWidth size="sm">Profile</Button>
                  </Link>
                  <Link href="/dashboard" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" fullWidth size="sm">Dashboard</Button>
                  </Link>
                  <div className="flex items-center">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button variant="outline" fullWidth size="sm">Sign In</Button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <Button fullWidth size="sm">Get Started</Button>
                  </SignInButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
