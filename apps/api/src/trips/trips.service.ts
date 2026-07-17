import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateTripDto, UpdateTripDto, TripListQueryDto, CreateLocationDto, UpdateLocationDto, ReorderLocationsDto } from './trips.dto';
import { Prisma, TripPrivacy, TripStatus } from '@prisma/client';
import { generateSlug } from '@common/utils/slug';
import { inferTheme } from '@common/utils/theme-inference';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Maps snake_case sort keys from the query string to Prisma schema fields.
  private static readonly SORT_FIELDS: Record<string, string> = {
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    start_date: 'startDate',
    end_date: 'endDate',
    title: 'title',
  };

  async listTrips(
    userId: string,
    query: TripListQueryDto,
    pagination: { cursor?: string; perPage: number; sort: string },
  ) {
    const [rawField, rawOrder] = pagination.sort.split(':');
    const sortField = TripsService.SORT_FIELDS[rawField] ?? 'createdAt';
    const sortOrder = rawOrder === 'asc' ? 'asc' : 'desc';
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
        coverPhoto: { select: { id: true, variants: true, originalUrl: true } },
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

    const slug = generateSlug(dto.title);
    const existingSlug = await this.prisma.trip.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // The trip row and the denormalized tripCount move together or not at all.
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
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
              latitude: loc.latitude ?? 0,
              longitude: loc.longitude ?? 0,
              country: loc.country,
              city: loc.city,
              order: idx,
              notes: loc.notes,
              theme: inferTheme(loc.name, loc.country, dto.tags) as unknown as Prisma.InputJsonValue,
            })) || [],
          },
        },
        include: {
          locations: { orderBy: { order: 'asc' } },
          coverPhoto: { select: { id: true, variants: true, originalUrl: true } },
          media: { orderBy: { order: 'asc' } },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { tripCount: { increment: 1 } },
      });

      // Matches the frontend TripRecord shape (getTrip includes isLiked).
      return { ...trip, isLiked: false };
    });
  }

  // userId is null for anonymous visitors (optional-auth route): they can
  // read PUBLIC and UNLISTED trips — that's what makes shared links work —
  // but never PRIVATE ones.
  async getTrip(userId: string | null, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        locations: { orderBy: { order: 'asc' } },
        coverPhoto: true,
        media: { orderBy: { order: 'asc' } },
        collaborators: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.privacy === 'PRIVATE' && trip.userId !== userId) {
      const collaborator = userId
        ? await this.prisma.tripCollaborator.findUnique({
            where: { tripId_userId: { tripId, userId } },
          })
        : null;
      if (!collaborator) {
        throw new ForbiddenException('You do not have access to this trip');
      }
    }

    const isLiked = userId
      ? await this.prisma.like.findUnique({
          where: { tripId_userId: { tripId, userId } },
        }).then(Boolean)
      : false;

    return { ...trip, isLiked };
  }

  async updateTrip(userId: string, tripId: string, dto: UpdateTripDto) {
    await this.getEditableTrip(tripId, userId);

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
        media: { orderBy: { order: 'asc' } },
      },
    });

    const isLiked = Boolean(
      await this.prisma.like.findUnique({ where: { tripId_userId: { tripId, userId } } }),
    );

    return { ...updated, isLiked };
  }

  async deleteTrip(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId) throw new ForbiddenException('Only the owner can delete a trip');

    await this.prisma.$transaction([
      this.prisma.trip.delete({ where: { id: tripId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { tripCount: { decrement: 1 } },
      }),
    ]);

    return { deleted: true };
  }

  async duplicateTrip(userId: string, tripId: string) {
    // Duplicating copies someone's whole itinerary into the caller's account,
    // so read access is not enough — restrict to the owner.
    const original = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { locations: true, media: true },
    });
    if (!original) throw new NotFoundException('Trip not found');
    if (original.userId !== userId) {
      throw new ForbiddenException('Only the owner can duplicate a trip');
    }

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    return this.prisma.$transaction(async (tx) => {
      const duplicated = await tx.trip.create({
        data: {
          userId,
          title: `${original.title} (Copy)`,
          slug: newSlug,
          description: original.description,
          startDate: original.startDate,
          endDate: original.endDate,
          privacy: 'PRIVATE',
          tags: original.tags,
          theme: original.theme ?? Prisma.JsonNull,
          locations: {
            create: original.locations.map((loc) => ({
              name: loc.name,
              latitude: loc.latitude,
              longitude: loc.longitude,
              country: loc.country,
              city: loc.city,
              order: loc.order,
              notes: loc.notes,
              theme: loc.theme ?? Prisma.JsonNull,
            })),
          },
        },
        include: { locations: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { tripCount: { increment: 1 } },
      });

      return duplicated;
    });
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

  private async getAccessibleTrip(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId && trip.privacy === 'PRIVATE') {
      // Collaborators can read a PRIVATE trip: anyone allowed to edit it
      // (getEditableTrip) must at minimum be allowed to see it.
      const collaborator = await this.prisma.tripCollaborator.findUnique({
        where: { tripId_userId: { tripId, userId } },
      });
      if (!collaborator) {
        throw new ForbiddenException('You do not have access to this trip');
      }
    }
    return trip;
  }

  // Mutation guard: owner or non-VIEWER collaborator. getAccessibleTrip is a
  // READ check (it admits anyone for non-PRIVATE trips) and must never gate
  // writes.
  private async getEditableTrip(tripId: string, userId: string) {
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
    return trip;
  }

  // ---- Trip locations (post-create itinerary editing) ----
  // Note: Trip has no denormalized locations counter (getTripStats counts
  // live), so none is maintained here.

  async addLocation(userId: string, tripId: string, dto: CreateLocationDto) {
    const trip = await this.getEditableTrip(tripId, userId);

    const maxOrder = await this.prisma.tripLocation.aggregate({
      where: { tripId },
      _max: { order: true },
    });

    return this.prisma.tripLocation.create({
      data: {
        tripId,
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        country: dto.country,
        city: dto.city,
        notes: dto.notes,
        order: (maxOrder._max.order ?? -1) + 1,
        theme: inferTheme(dto.name, dto.country, trip.tags) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updateLocation(userId: string, tripId: string, locationId: string, dto: UpdateLocationDto) {
    const trip = await this.getEditableTrip(tripId, userId);

    const location = await this.prisma.tripLocation.findUnique({ where: { id: locationId } });
    if (!location || location.tripId !== tripId) {
      throw new NotFoundException('Location not found on this trip');
    }

    // The atmosphere theme derives from the place; recompute when it changes.
    const themeInputsChanged =
      (dto.name !== undefined && dto.name !== location.name) ||
      (dto.country !== undefined && dto.country !== location.country);

    return this.prisma.tripLocation.update({
      where: { id: locationId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(themeInputsChanged && {
          theme: inferTheme(
            dto.name ?? location.name,
            dto.country ?? location.country ?? undefined,
            trip.tags,
          ) as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async removeLocation(userId: string, tripId: string, locationId: string) {
    await this.getEditableTrip(tripId, userId);

    const location = await this.prisma.tripLocation.findUnique({ where: { id: locationId } });
    if (!location || location.tripId !== tripId) {
      throw new NotFoundException('Location not found on this trip');
    }

    // Media.location has onDelete: SetNull, so attached photos survive the
    // delete; we only need to re-compact the remaining stops' order.
    await this.prisma.tripLocation.delete({ where: { id: locationId } });

    const remaining = await this.prisma.tripLocation.findMany({
      where: { tripId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    await this.prisma.$transaction(
      remaining
        .map((loc, idx) => ({ loc, idx }))
        .filter(({ loc, idx }) => loc.order !== idx)
        .map(({ loc, idx }) =>
          this.prisma.tripLocation.update({ where: { id: loc.id }, data: { order: idx } }),
        ),
    );

    return { deleted: true };
  }

  async reorderLocations(userId: string, tripId: string, dto: ReorderLocationsDto) {
    await this.getEditableTrip(tripId, userId);

    const locations = await this.prisma.tripLocation.findMany({
      where: { tripId },
      select: { id: true },
    });
    const existingIds = new Set(locations.map((l) => l.id));
    const requestedIds = new Set(dto.locationIds);
    if (
      existingIds.size !== dto.locationIds.length ||
      requestedIds.size !== dto.locationIds.length ||
      [...existingIds].some((id) => !requestedIds.has(id))
    ) {
      throw new BadRequestException('locationIds must contain every location of the trip exactly once');
    }

    await this.prisma.$transaction(
      dto.locationIds.map((id, idx) =>
        this.prisma.tripLocation.update({ where: { id }, data: { order: idx } }),
      ),
    );

    return this.prisma.tripLocation.findMany({ where: { tripId }, orderBy: { order: 'asc' } });
  }

  async likeTrip(userId: string, tripId: string) {
    const trip = await this.getAccessibleTrip(tripId, userId);

    try {
      // Like row and counter move atomically; a P2002 rolls back the counter.
      await this.prisma.$transaction(async (tx) => {
        await tx.like.create({ data: { tripId, userId } });
        await tx.trip.update({
          where: { id: tripId },
          data: { likesCount: { increment: 1 } },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Trip already liked');
      }
      throw e;
    }

    if (trip.userId !== userId) {
      const liker = await this.prisma.user.findUnique({ where: { id: userId } });
      await this.notifications.create({
        userId: trip.userId,
        type: 'like',
        title: `${liker?.displayName || liker?.username || 'Someone'} liked your trip`,
        body: trip.title,
        data: { tripId, userId },
      });
    }

    return { liked: true };
  }

  async unlikeTrip(userId: string, tripId: string) {
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.like.deleteMany({ where: { tripId, userId } });
      if (result.count > 0) {
        await tx.trip.update({
          where: { id: tripId },
          data: { likesCount: { decrement: 1 } },
        });
      }
    });
    return { liked: false };
  }
}
