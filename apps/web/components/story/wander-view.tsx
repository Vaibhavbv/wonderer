"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowLeft, ChevronUp, ChevronDown, Play, Pause } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface WanderViewProps {
  tripId: string;
}

interface StoryBlock {
  id: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
  content: Record<string, any>;
}

// Mock story data for the immersive scroll experience
const mockStoryBlocks: StoryBlock[] = [
  {
    id: "hero",
    type: "hero",
    position: { x: 0, y: 0, w: 12, h: 6 },
    content: {
      title: "Kyoto Cherry Blossom Season",
      subtitle: "April 1–7, 2025",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&h=1080&fit=crop",
    },
  },
  {
    id: "intro",
    type: "text",
    position: { x: 0, y: 6, w: 12, h: 3 },
    content: {
      text: "The first light of dawn filtered through the torii gates of Fushimi Inari, painting the path in shades of amber and gold. We had arrived in Kyoto at the peak of cherry blossom season, and the city was awash in pink.",
      style: "quote",
    },
  },
  {
    id: "photo_1",
    type: "photo",
    position: { x: 0, y: 9, w: 12, h: 5 },
    content: {
      image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&h=800&fit=crop",
      caption: "Fushimi Inari at dawn — the silence before the crowds arrive",
      location: "Fushimi Inari, Kyoto",
    },
  },
  {
    id: "route_1",
    type: "map-route",
    position: { x: 0, y: 14, w: 12, h: 4 },
    content: {
      from: { name: "Fushimi Inari", lat: 35.0116, lng: 135.7681 },
      to: { name: "Kinkaku-ji", lat: 35.0394, lng: 135.7292 },
      mode: "transit",
      distance: "8.2 km",
    },
  },
  {
    id: "photo_2",
    type: "photo",
    position: { x: 0, y: 18, w: 12, h: 5 },
    content: {
      image: "https://images.unsplash.com/photo-1524413842407-16c525364b9b?w=1200&h=800&fit=crop",
      caption: "The Golden Pavilion reflected in its mirror pond — perfection in architecture",
      location: "Kinkaku-ji, Kyoto",
    },
  },
  {
    id: "text_2",
    type: "text",
    position: { x: 0, y: 23, w: 12, h: 3 },
    content: {
      text: "Kinkaku-ji gleamed impossibly gold against the overcast sky, its reflection in the mirror pond so perfect it seemed to defy the laws of physics. A single cherry blossom petal drifted down and landed on the water, sending ripples through the reflection.",
      style: "normal",
    },
  },
  {
    id: "photo_3",
    type: "photo",
    position: { x: 0, y: 26, w: 12, h: 5 },
    content: {
      image: "https://images.unsplash.com/photo-1545569341-9eb8b387679e?w=1200&h=800&fit=crop",
      caption: "Arashiyama Bamboo Grove — walking through a cathedral of green",
      location: "Arashiyama, Kyoto",
    },
  },
  {
    id: "outro",
    type: "text",
    position: { x: 0, y: 31, w: 12, h: 3 },
    content: {
      text: "Seven days in Kyoto felt like a lifetime and a heartbeat. The city had imprinted itself on our souls — the scent of incense, the rustle of bamboo, the pale pink of a thousand cherry blossoms. We left with full memory cards and fuller hearts.",
      style: "quote",
    },
  },
];

const totalBlocks = mockStoryBlocks.length;

export function WanderView({ tripId }: WanderViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const progressPercent = useTransform(smoothProgress, [0, 1], [0, 100]);

  // Map position interpolation based on scroll
  const mapLat = useTransform(
    smoothProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [35.0116, 35.025, 35.0394, 35.024, 35.0094]
  );
  const mapLng = useTransform(
    smoothProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [135.7681, 135.748, 135.7292, 135.698, 135.6668]
  );
  const mapZoom = useTransform(
    smoothProgress,
    [0, 0.15, 0.35, 0.55, 0.75, 1],
    [14, 15, 16, 15, 14, 13]
  );

  // Route line progress
  const routeProgress = useTransform(smoothProgress, [0, 1], [0, 100]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    const index = Math.min(
      Math.floor(progress * totalBlocks),
      totalBlocks - 1
    );
    setCurrentIndex(index);

    // Show controls on scroll
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const scrollToBlock = (index: number) => {
    if (!containerRef.current) return;
    const blockHeight = containerRef.current.scrollHeight / totalBlocks;
    containerRef.current.scrollTo({
      top: blockHeight * index,
      behavior: "smooth",
    });
  };

  const toggleAutoPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      let idx = currentIndex;
      const interval = setInterval(() => {
        idx = (idx + 1) % totalBlocks;
        scrollToBlock(idx);
        if (idx === totalBlocks - 1) {
          clearInterval(interval);
          setIsPlaying(false);
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  };

  const currentBlock = mockStoryBlocks[currentIndex];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-secondary-900 to-secondary-800 flex items-center justify-center">
          <div className="text-white/20 text-center">
            <p className="text-2xl font-heading">Mapbox GL Map</p>
            <p className="text-sm mt-2">
              Lat: {currentBlock?.content?.location ? "35.0xxx" : "—"} | 
              Lng: {currentBlock?.content?.location ? "135.xxx" : "—"} | 
              Zoom: {Math.round(14 - currentIndex * 0.3)}
            </p>
            <p className="text-xs mt-4 max-w-md mx-auto text-white/30">
              In production: Mapbox GL canvas with animated center, zoom, and pitch 
              synced to scroll progress via Framer Motion useTransform
            </p>
          </div>
        </div>
        {/* Route line overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.line
            x1="30%"
            y1="70%"
            x2="70%"
            y2="30%"
            stroke="#E85D4C"
            strokeWidth="3"
            strokeDasharray="1000"
            strokeDashoffset={useTransform(routeProgress, [0, 100], [1000, 0])}
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
        {/* Vehicle icon */}
        <motion.div
          className="absolute w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg"
          style={{
            left: useTransform(smoothProgress, [0, 1], ["30%", "70%"]),
            top: useTransform(smoothProgress, [0, 1], ["70%", "30%"]),
          }}
        >
          <span className="text-white text-xs">✈</span>
        </motion.div>
      </div>

      {/* Scrollable Content Layer */}
      <div
        ref={containerRef}
        className="relative z-10 h-full overflow-y-auto scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div className="relative" style={{ height: `${totalBlocks * 100}vh` }}>
          {mockStoryBlocks.map((block, index) => (
            <motion.div
              key={block.id}
              className="sticky top-0 h-screen flex items-center justify-center px-6"
              style={{ scrollSnapAlign: "start" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, margin: "-20%" }}
              transition={{ duration: 0.5 }}
            >
              {block.type === "hero" && (
                <div className="relative w-full max-w-4xl text-center">
                  <div className="absolute inset-0 -z-10 opacity-30">
                    <img
                      src={block.content.image}
                      alt=""
                      className="w-full h-full object-cover rounded-3xl blur-sm"
                    />
                  </div>
                  <h1 className="font-heading text-5xl sm:text-7xl font-bold text-white drop-shadow-lg">
                    {block.content.title}
                  </h1>
                  <p className="mt-4 text-xl text-white/80 drop-shadow">
                    {block.content.subtitle}
                  </p>
                </div>
              )}

              {block.type === "text" && (
                <div className="max-w-2xl mx-auto text-center">
                  <blockquote className="font-heading text-2xl sm:text-3xl text-white leading-relaxed drop-shadow-lg">
                    "{block.content.text}"
                  </blockquote>
                </div>
              )}

              {block.type === "photo" && (
                <div className="max-w-3xl w-full">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={block.content.image}
                      alt={block.content.caption}
                      className="w-full h-auto"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <p className="text-white font-medium">{block.content.caption}</p>
                      <p className="text-white/60 text-sm mt-1">{block.content.location}</p>
                    </div>
                  </div>
                </div>
              )}

              {block.type === "map-route" && (
                <div className="max-w-lg text-center bg-black/40 backdrop-blur-xl rounded-2xl p-8">
                  <p className="text-white/60 text-sm uppercase tracking-wider">Traveling to</p>
                  <h2 className="font-heading text-3xl font-bold text-white mt-2">
                    {block.content.to.name}
                  </h2>
                  <div className="flex items-center justify-center gap-4 mt-4 text-white/80">
                    <span>{block.content.from.name}</span>
                    <span className="text-primary-400">→</span>
                    <span>{block.content.to.name}</span>
                  </div>
                  <p className="text-white/60 text-sm mt-2">{block.content.distance}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Controls */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        <Link href={`/trips/${tripId}`}>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={toggleAutoPlay}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>

      {/* Timeline Progress (Right Side) */}
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: showControls ? 1 : 0, x: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-1 h-48 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full bg-primary-500 rounded-full"
            style={{ height: progressPercent }}
          />
        </div>
        <div className="flex flex-col gap-1">
          {mockStoryBlocks.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToBlock(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-primary-500 scale-125" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom Info Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="text-white/80 text-sm">
            {currentIndex + 1} / {totalBlocks}
          </div>
          <div className="text-white text-sm font-medium">
            {currentBlock?.content?.location || currentBlock?.content?.title || "Wandering..."}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToBlock(Math.max(0, currentIndex - 1))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToBlock(Math.min(totalBlocks - 1, currentIndex + 1))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
