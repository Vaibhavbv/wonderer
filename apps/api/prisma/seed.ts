import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo digital-nomad profiles + trips so the social feed/profile/discover
// endpoints return rich data in development and demos. Idempotent: re-running
// upserts by username and clears each demo user's trips first.

type SeedLocation = { name: string; city: string; country: string; lat: number; lng: number };
type SeedTrip = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  tags: string[];
  cover: string;
  locations: SeedLocation[];
};
type SeedUser = {
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  location: string;
  trips: SeedTrip[];
};

const users: SeedUser[] = [
  {
    username: 'ayanomad',
    displayName: 'Aya Nakamura',
    email: 'aya@demo.wanderverse.app',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    bio: 'Designer living out of a backpack. 32 countries and counting.',
    location: 'Currently: Lisbon',
    trips: [
      {
        title: 'Cherry Blossom Season in Kyoto',
        description: 'A week chasing sakura through temples and bamboo groves.',
        startDate: '2025-03-28', endDate: '2025-04-04',
        tags: ['japan', 'spring', 'temples'],
        cover: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop',
        locations: [
          { name: 'Fushimi Inari', city: 'Kyoto', country: 'JP', lat: 35.0116, lng: 135.7681 },
          { name: 'Arashiyama Bamboo Grove', city: 'Kyoto', country: 'JP', lat: 35.0094, lng: 135.6667 },
          { name: 'Kinkaku-ji', city: 'Kyoto', country: 'JP', lat: 35.0394, lng: 135.7292 },
        ],
      },
      {
        title: 'Lisbon Slow Living',
        description: 'Two months of pastel de nata, tram 28, and Atlantic sunsets.',
        startDate: '2025-05-01', endDate: '2025-06-28',
        tags: ['portugal', 'remote-work', 'coast'],
        cover: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=800&fit=crop',
        locations: [
          { name: 'Alfama', city: 'Lisbon', country: 'PT', lat: 38.7139, lng: -9.1277 },
          { name: 'Belém Tower', city: 'Lisbon', country: 'PT', lat: 38.6916, lng: -9.2160 },
        ],
      },
    ],
  },
  {
    username: 'marcooverland',
    displayName: 'Marco Rossi',
    email: 'marco@demo.wanderverse.app',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    bio: 'Van life across Europe. The road is the destination.',
    location: 'Currently: Amalfi Coast',
    trips: [
      {
        title: 'The Amalfi Coastal Road',
        description: 'Hairpin turns, lemon groves, and the bluest sea I have ever seen.',
        startDate: '2025-04-12', endDate: '2025-04-22',
        tags: ['italy', 'roadtrip', 'vanlife'],
        cover: 'https://images.unsplash.com/photo-1533165850316-fc4f9b1a1f3b?w=1200&h=800&fit=crop',
        locations: [
          { name: 'Positano', city: 'Positano', country: 'IT', lat: 40.6281, lng: 14.4848 },
          { name: 'Amalfi', city: 'Amalfi', country: 'IT', lat: 40.6340, lng: 14.6027 },
          { name: 'Ravello', city: 'Ravello', country: 'IT', lat: 40.6492, lng: 14.6118 },
        ],
      },
    ],
  },
  {
    username: 'lenafjords',
    displayName: 'Lena Karlsen',
    email: 'lena@demo.wanderverse.app',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    bio: 'Photographer. Cold places, big skies.',
    location: 'Currently: Bergen',
    trips: [
      {
        title: 'Norwegian Fjords by Ferry',
        description: 'Sailing between cliffs that fall straight into the sea.',
        startDate: '2025-06-02', endDate: '2025-06-11',
        tags: ['norway', 'fjords', 'photography'],
        cover: 'https://images.unsplash.com/photo-1601439678777-b2b3c56fa627?w=1200&h=800&fit=crop',
        locations: [
          { name: 'Nærøyfjord', city: 'Gudvangen', country: 'NO', lat: 60.9167, lng: 6.8667 },
          { name: 'Bergen', city: 'Bergen', country: 'NO', lat: 60.3913, lng: 5.3221 },
        ],
      },
    ],
  },
  {
    username: 'omardunes',
    displayName: 'Omar Haddad',
    email: 'omar@demo.wanderverse.app',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    bio: 'Chasing deserts and old cities. Tea everywhere.',
    location: 'Currently: Marrakech',
    trips: [
      {
        title: 'Sahara Desert Run',
        description: 'From the souks of Marrakech to a night under the Saharan stars.',
        startDate: '2025-08-18', endDate: '2025-08-27',
        tags: ['morocco', 'desert', 'adventure'],
        cover: 'https://images.unsplash.com/photo-1489493512598-d08130f49bea?w=1200&h=800&fit=crop',
        locations: [
          { name: 'Jemaa el-Fnaa', city: 'Marrakech', country: 'MA', lat: 31.6258, lng: -7.9890 },
          { name: 'Merzouga Dunes', city: 'Merzouga', country: 'MA', lat: 31.0989, lng: -4.0136 },
        ],
      },
    ],
  },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('Seeding demo nomads...');
  const created: { id: string; username: string }[] = [];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { displayName: u.displayName, avatarUrl: u.avatarUrl, bio: u.bio, location: u.location },
      create: {
        clerkId: `seed_${u.username}`,
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        location: u.location,
      },
    });
    created.push({ id: user.id, username: u.username });

    // Reset this user's demo trips for idempotency.
    await prisma.trip.deleteMany({ where: { userId: user.id } });

    for (const t of u.trips) {
      const trip = await prisma.trip.create({
        data: {
          userId: user.id,
          title: t.title,
          slug: `${slugify(t.title)}-${Math.random().toString(36).slice(2, 7)}`,
          description: t.description,
          status: 'PUBLISHED',
          privacy: 'PUBLIC',
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate),
          tags: t.tags,
          photosCount: t.locations.length,
          likesCount: Math.floor(Math.random() * 200),
          viewsCount: Math.floor(Math.random() * 2000),
          locations: {
            create: t.locations.map((l, i) => ({
              name: l.name, city: l.city, country: l.country,
              latitude: l.lat, longitude: l.lng, order: i,
            })),
          },
        },
      });

      // Cover photo as a Media row, then link it back to the trip.
      const cover = await prisma.media.create({
        data: {
          tripId: trip.id, userId: user.id, type: 'IMAGE',
          mimeType: 'image/jpeg', filename: 'cover.jpg', originalUrl: t.cover,
        },
      });
      await prisma.trip.update({ where: { id: trip.id }, data: { coverPhotoId: cover.id } });
    }
  }

  // Follow graph: everyone follows Aya; Aya follows Marco; Marco follows Lena.
  const byName = Object.fromEntries(created.map((c) => [c.username, c.id]));
  const edges: [string, string][] = [
    ['marcooverland', 'ayanomad'],
    ['lenafjords', 'ayanomad'],
    ['omardunes', 'ayanomad'],
    ['ayanomad', 'marcooverland'],
    ['marcooverland', 'lenafjords'],
  ];
  for (const [follower, following] of edges) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: byName[follower], followingId: byName[following] } },
      update: {},
      create: { followerId: byName[follower], followingId: byName[following] },
    });
  }

  console.log(`Seeded ${created.length} nomads with trips and follows.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
