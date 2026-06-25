import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk v6 requires clerkMiddleware() for server-side helpers (auth(),
// currentUser()) to work. But clerkMiddleware THROWS on every request if
// CLERK_SECRET_KEY is missing, which would take the whole public site down.
// So we only enable Clerk when the secret key is configured; otherwise we
// pass requests through untouched. Set CLERK_SECRET_KEY to enable auth.
const clerkEnabled = !!process.env.CLERK_SECRET_KEY;

export default clerkEnabled ? clerkMiddleware() : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
