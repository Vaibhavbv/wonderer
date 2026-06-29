// The destinations that make up the homepage journey. Each one drives the
// background atmosphere, the route stop, the floating card, and the theme.

export type Vehicle = "plane" | "van" | "jeep" | "motorcycle" | "train" | "balloon";

export interface Destination {
  id: string;
  name: string;
  country?: string;
  date?: string;
  days?: number;
  memories: number;
  favorite?: string;
  weather?: string;
  mood: string;
  vehicle: Vehicle;
  image?: string;
  // Theme — atmosphere colors for this leg (hex, work on a dark scrim).
  theme: {
    from: string; // gradient top
    to: string; // gradient bottom
    accent: string; // glow / route highlight
    particle: "petals" | "snow" | "sun" | "sand" | "mist" | "stars" | "leaves";
  };
}

export const journey: Destination[] = [
  {
    id: "delhi",
    name: "Delhi",
    country: "India",
    date: "March 2024",
    days: 3,
    memories: 48,
    favorite: "Dawn over Jama Masjid",
    weather: "29° · Hazy sun",
    mood: "Where it all began",
    vehicle: "jeep",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&q=80&auto=format&fit=crop",
    theme: { from: "#3a2718", to: "#1a1209", accent: "#E8A33D", particle: "sand" },
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    country: "India",
    date: "March 2024",
    days: 2,
    memories: 31,
    favorite: "Ganga aarti at dusk",
    weather: "24° · Clear",
    mood: "The river calls",
    vehicle: "motorcycle",
    image: "https://images.unsplash.com/photo-1591018653367-7cd4f0f3c0a6?w=1600&q=80&auto=format&fit=crop",
    theme: { from: "#14342b", to: "#0a1a16", accent: "#34d399", particle: "leaves" },
  },
  {
    id: "spiti",
    name: "Spiti Valley",
    country: "India",
    date: "April 2024",
    days: 6,
    memories: 92,
    favorite: "Key Monastery under stars",
    weather: "-4° · Snow",
    mood: "Cold desert, warm hearts",
    vehicle: "jeep",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=80&auto=format&fit=crop",
    theme: { from: "#1e3a5f", to: "#0a1626", accent: "#7cc4ff", particle: "snow" },
  },
  {
    id: "leh",
    name: "Leh, Ladakh",
    country: "India",
    date: "April 2024",
    days: 5,
    memories: 77,
    favorite: "Pangong Lake at first light",
    weather: "8° · Crisp",
    mood: "Roof of the world",
    vehicle: "motorcycle",
    image: "https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=1600&q=80&auto=format&fit=crop",
    theme: { from: "#243b53", to: "#0d1b29", accent: "#9ad0ec", particle: "mist" },
  },
  {
    id: "goa",
    name: "Goa",
    country: "India",
    date: "May 2024",
    days: 4,
    memories: 63,
    favorite: "Sunset at Palolem",
    weather: "31° · Warm",
    mood: "Salt, sun, and slow days",
    vehicle: "van",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&q=80&auto=format&fit=crop",
    theme: { from: "#5a2e1a", to: "#2a1409", accent: "#ff9e5e", particle: "sun" },
  },
  {
    id: "japan",
    name: "Kyoto",
    country: "Japan",
    date: "July 2024",
    days: 7,
    memories: 128,
    favorite: "Cherry blossoms at Fushimi Inari",
    weather: "26° · Soft sun",
    mood: "Quiet magic everywhere",
    vehicle: "train",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80&auto=format&fit=crop",
    theme: { from: "#5a2438", to: "#2a1019", accent: "#ff8fb1", particle: "petals" },
  },
  {
    id: "switzerland",
    name: "Switzerland",
    country: "Alps",
    date: "September 2024",
    days: 8,
    memories: 154,
    favorite: "Glacier Express through the snow",
    weather: "12° · Alpine fog",
    mood: "Where the journey peaks",
    vehicle: "train",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1600&q=80&auto=format&fit=crop",
    theme: { from: "#22384d", to: "#0c1822", accent: "#a8e0ff", particle: "snow" },
  },
];

export function getDestination(id: string): Destination | undefined {
  return journey.find((d) => d.id === id);
}
