import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateTripDto, UpdateTripDto, TripListQueryDto } from './trips.dto';
import { TripPrivacy, TripStatus } from '@prisma/client';
import { generateSlug } from '@common/utils/slug';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listTrips(
    userId: string,
    query: TripListQueryDto,
    pagination: { cursor?: string; perPage: number; sort: string },
  ) {
    const [sortField, sortOrder] = pagination.sort.split(':');
    const where = {
      userId,
      ...(query.status && { status: query.status as TripStatus }),
      ...(query.privacy && { privacy: query.privacy as TripPrivacy }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
          { tags: { has: query.search } },
        ],
      }),
    };

    const trips = await this.prisma.trip.findMany({
      where,
      take: pagination.perPage + 1,
      ...(pagination.cursor && { skip: 1, cursor: { id: pagination.cursor } }),
      orderBy: { [sortField]: sortOrder },
      include: {
        locations: { orderBy: { order: 'asc' } },
        coverPhoto: { select: { id: true, thumbnailUrl: true, originalUrl: true } },
      },
    });

    const hasMore = trips.length > pagination.perPage;
    const items = hasMore ? trips.slice(0, -1) : trips;

    return {
      data: items,
      meta: {
        perPage: pagination.perPage,
        nextCursor: hasMore ? items[items.length - 1].id : null,
        total: await this.prisma.trip.count({ where }),
      },
    };
  }

  async createTrip(userId: string, dto: CreateTripDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.tripCount >= user.tripQuota) {
      throw new ForbiddenException('Trip quota exceeded. Upgrade your plan.');
    }

    const slug = generateSlug(dto.title);
    const existingSlug = await this.prisma.trip.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const trip = await this.prisma.trip.create({
      data: {
        userId,
        title: dto.title,
        slug: finalSlug,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        privacy: (dto.privacy as TripPrivacy) || 'PRIVATE',
        tags: dto.tags || [],
        theme: dto.theme || {},
        locations: {
          create: dto.locations?.map((loc, idx) => ({
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            country: loc.country,
            city: loc.city,
            order: idx,
          })) || [],
        },
      },
      include: {
        locations: { orderBy: { order: 'asc' } },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { tripCount: { increment: 1 } },
    });

    return trip;
  }

  async getTrip(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        locations: { orderBy: { order: 'asc' } },
        coverPhoto: true,
        media: { orderBy: { order: 'asc' }, take: 20 },
        collaborators: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId && trip.privacy === 'PRIVATE') {
      throw new ForbiddenException('You do not have access to this trip');
    }

    return trip;
  }

  async updateTrip(userId: string, tripId: string, dto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId) {
      const collaborator = await this.prisma.tripCollaborator.findUnique({
        where: { tripId_userId: { tripId, userId } },
      });
      if (!collaborator || collaborator.role === 'VIEWER') {
        throw new ForbiddenException('You do not have permission to edit this trip');
      }
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.privacy && { privacy: dto.privacy as TripPrivacy }),
        ...(dto.status && { status: dto.status as TripStatus }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.theme && { theme: dto.theme }),
        ...(dto.coverPhotoId && { coverPhotoId: dto.coverPhotoId }),
      },
      include: {
        locations: { orderBy: { order: 'asc' } },
        coverPhoto: true,
      },
    });

    return updated;
  }

  async deleteTrip(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId) throw new ForbiddenException('Only the owner can delete a trip');

    await this.prisma.trip.delete({ where: { id: tripId } });
    await this.prisma.user.update({
      where: { id: userId },
      data: { tripCount: { decrement: 1 } },
    });

    return { deleted: true };
  }

  async duplicateTrip(userId: string, tripId: string) {
    const original = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { locations: true, media: true },
    });
    if (!original) throw new NotFoundException('Trip not found');

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const duplicated = await this.prisma.trip.create({
      data: {
        userId,
        title: `${original.title} (Copy)`,
        slug: newSlug,
        description: original.description,
        startDate: original.startDate,
        endDate: original.endDate,
        privacy: 'PRIVATE',
        tags: original.tags,
        theme: original.theme,
        locations: {
          create: original.locations.map((loc) => ({
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            country: loc.country,
            city: loc.city,
            order: loc.order,
          })),
        },
      },
      include: { locations: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { tripCount: { increment: 1 } },
    });

    return duplicated;
  }

  async getTripStats(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId) throw new ForbiddenException();

    return {
      tripId,
      photosCount: trip.photosCount,
      videosCount: trip.videosCount,
      storyBlocksCount: trip.storyBlocksCount,
      viewsCount: trip.viewsCount,
      likesCount: trip.likesCount,
      commentsCount: trip.commentsCount,
      locationsCount: await this.prisma.tripLocation.count({ where: { tripId } }),
      totalMediaSize: await this.prisma.media.aggregate({
        where: { tripId },
        _sum: { fileSize: true },
      }).then((r) => r._sum.fileSize || 0),
    };
  }
}
