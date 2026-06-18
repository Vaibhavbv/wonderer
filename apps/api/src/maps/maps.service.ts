import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getTripRoute(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { locations: { orderBy: { order: 'asc' } } },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId && trip.privacy === 'PRIVATE') {
      throw new ForbiddenException('You do not have access to this trip');
    }

    const locations = trip.locations;
    if (locations.length < 2) {
      return {
        tripId,
        distanceKm: 0,
        durationHours: 0,
        legs: [],
        totalBounds: null,
      };
    }

    const legs = [];
    let totalDistance = 0;

    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i];
      const to = locations[i + 1];
      const distance = this.haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
      totalDistance += distance;

      legs.push({
        from: { name: from.name, lat: from.latitude, lng: from.longitude },
        to: { name: to.name, lat: to.latitude, lng: to.longitude },
        distanceKm: Math.round(distance * 10) / 10,
        durationMinutes: Math.round(distance * 12), // Rough estimate: 5km/h walking
        mode: 'transit',
        geometry: {
          type: 'LineString',
          coordinates: [
            [from.longitude, from.latitude],
            [to.longitude, to.latitude],
          ],
        },
      });
    }

    const lats = locations.map((l) => l.latitude);
    const lngs = locations.map((l) => l.longitude);

    return {
      tripId,
      distanceKm: Math.round(totalDistance * 10) / 10,
      durationHours: Math.round(totalDistance * 12) / 60,
      legs,
      totalBounds: {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
      },
    };
  }

  async getTripHeatmap(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { media: { select: { latitude: true, longitude: true } } },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId && trip.privacy === 'PRIVATE') {
      throw new ForbiddenException();
    }

    return {
      tripId,
      points: trip.media
        .filter((m) => m.latitude && m.longitude)
        .map((m) => ({
          lat: m.latitude,
          lng: m.longitude,
          intensity: 1,
        })),
    };
  }

  async forwardGeocode(query: string) {
    // Integration with Mapbox Geocoding API
    const token = this.configService.get('MAPBOX_ACCESS_TOKEN');
    return {
      query,
      results: [], // Placeholder for Mapbox integration
      source: 'mapbox',
    };
  }

  async reverseGeocode(lat: number, lng: number) {
    const token = this.configService.get('MAPBOX_ACCESS_TOKEN');
    return {
      lat,
      lng,
      results: [], // Placeholder for Mapbox integration
      source: 'mapbox',
    };
  }

  async getMapStyles() {
    return [
      { id: 'wander-light', name: 'Wander Light', url: 'mapbox://styles/wanderverse/light' },
      { id: 'wander-dark', name: 'Wander Dark', url: 'mapbox://styles/wanderverse/dark' },
      { id: 'wander-satellite', name: 'Satellite', url: 'mapbox://styles/wanderverse/satellite' },
      { id: 'wander-outdoors', name: 'Outdoors', url: 'mapbox://styles/wanderverse/outdoors' },
      { id: 'wander-streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
      { id: 'wander-navigation', name: 'Navigation', url: 'mapbox://styles/mapbox/navigation-day-v1' },
      { id: 'wander-paper', name: 'Paper', url: 'mapbox://styles/wanderverse/paper' },
      { id: 'wander-retro', name: 'Retro', url: 'mapbox://styles/wanderverse/retro' },
    ];
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
