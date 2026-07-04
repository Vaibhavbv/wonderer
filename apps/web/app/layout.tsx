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
  title: "Wanderverse — Map your life",
  description: "The social network for travel. Your profile is a living map of everywhere you've ever been — follow friends and creators and watch their journeys unfold.",
  keywords: ["travel", "social", "map", "journeys", "trips", "followers", "digital nomad", "travel map"],
  authors: [{ name: "Wanderverse" }],
  openGraph: {
    title: "Wanderverse — Map your life",
    description: "The social network for travel. Your profile is a living map of everywhere you've ever been.",
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
