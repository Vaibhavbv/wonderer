import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wanderverse — Your Travel Memories, Reimagined",
  description: "A premium digital travel-memory platform combining interactive maps, storytelling, and AI-generated travel content. Transform your journeys into immersive, cinematic experiences.",
  keywords: ["travel", "memories", "maps", "storytelling", "scrapbook", "photos", "journal"],
  authors: [{ name: "Wanderverse" }],
  openGraph: {
    title: "Wanderverse",
    description: "Your Travel Memories, Reimagined",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
        <body className="antialiased min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
