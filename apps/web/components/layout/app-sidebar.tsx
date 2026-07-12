"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Compass,
  LayoutDashboard,
  Map,
  Menu,
  Plane,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "My trips", href: "/dashboard", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Journey", href: "/journey", icon: Map },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <Link href="/" className="flex items-center gap-2 px-3" onClick={onNavigate}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm">
          <Plane className="h-5 w-5" />
        </span>
        <span className="font-heading text-xl font-bold text-text-primary">Wanderverse</span>
      </Link>

      <nav className="mt-10 space-y-1" aria-label="Main navigation">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname.startsWith("/dashboard") || pathname.startsWith("/trips/") : pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-500/15 text-primary-400"
                  : "text-text-secondary hover:bg-surface-pressed hover:text-text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          Create a trip
        </Link>
      </div>
    </>
  );
}

export function AppSidebar({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface p-5 lg:flex">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
            <Plane className="h-4 w-4" />
          </span>
          <span className="font-heading text-lg font-bold text-text-primary">Wanderverse</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserButton afterSignOutUrl="/" />
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 text-text-primary hover:bg-surface-pressed"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-surface p-5 shadow-xl">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-text-secondary hover:bg-surface-pressed"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:ml-64">{children}</main>
    </div>
  );
}
