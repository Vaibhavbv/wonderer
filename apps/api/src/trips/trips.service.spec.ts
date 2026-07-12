import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TripsService } from './trips.service';
import { PrismaService } from '@prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const uniqueConstraintError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.2.1',
  });

describe('TripsService', () => {
  let service: TripsService;
  let prisma: {
    trip: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
    like: Record<string, jest.Mock>;
    tripLocation: Record<string, jest.Mock>;
    tripCollaborator: Record<string, jest.Mock>;
    media: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let notifications: { create: jest.Mock };

  beforeEach(async () => {
    prisma = {
      trip: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      like: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      tripLocation: {
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
      tripCollaborator: {
        findUnique: jest.fn(),
      },
      media: {
        aggregate: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    notifications = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(TripsService);
  });

  describe('createTrip', () => {
    it('throws if the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createTrip('user-1', { title: 'Japan' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows creating a trip even when the trip quota is exhausted', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', tripCount: 5, tripQuota: 5 });
      prisma.trip.findUnique.mockResolvedValue(null);
      prisma.trip.create.mockResolvedValue({ id: 'trip-1', slug: 'japan' });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.createTrip('user-1', { title: 'Japan' } as any),
      ).resolves.toBeDefined();
    });

    it('appends a timestamp suffix when the slug already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', tripCount: 0, tripQuota: 10 });
      prisma.trip.findUnique.mockResolvedValue({ id: 'existing-trip' });
      prisma.trip.create.mockResolvedValue({ id: 'trip-1', slug: 'japan-123' });
      prisma.user.update.mockResolvedValue({});

      await service.createTrip('user-1', { title: 'Japan' } as any);

      const createArgs = prisma.trip.create.mock.calls[0][0];
      expect(createArgs.data.slug).toMatch(/^japan-\d+$/);
    });

    it('increments the user trip count on success', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', tripCount: 0, tripQuota: 10 });
      prisma.trip.findUnique.mockResolvedValue(null);
      prisma.trip.create.mockResolvedValue({ id: 'trip-1', slug: 'japan' });
      prisma.user.update.mockResolvedValue({});

      await service.createTrip('user-1', { title: 'Japan' } as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tripCount: { increment: 1 } },
      });
    });
  });

  describe('getTrip', () => {
    it('throws NotFoundException when the trip does not exist', async () => {
      prisma.trip.findUnique.mockResolvedValue(null);

      await expect(service.getTrip('user-1', 'trip-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for a private trip owned by someone else', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'other-user', privacy: 'PRIVATE' });

      await expect(service.getTrip('user-1', 'trip-1')).rejects.toThrow(ForbiddenException);
    });

    it('allows the owner to access their own private trip and reports isLiked', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'user-1', privacy: 'PRIVATE' });
      prisma.like.findUnique.mockResolvedValue({ tripId: 'trip-1', userId: 'user-1' });

      const result = await service.getTrip('user-1', 'trip-1');

      expect(result.isLiked).toBe(true);
    });

    it('allows a non-owner to access a public trip and reports isLiked false when unliked', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'other-user', privacy: 'PUBLIC' });
      prisma.like.findUnique.mockResolvedValue(null);

      const result = await service.getTrip('user-1', 'trip-1');

      expect(result.isLiked).toBe(false);
    });
  });

  describe('updateTrip', () => {
    it('throws NotFoundException when the trip does not exist', async () => {
      prisma.trip.findUnique.mockResolvedValue(null);

      await expect(service.updateTrip('user-1', 'trip-1', { title: 'New' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for a non-owner with no collaborator record', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner' });
      prisma.tripCollaborator.findUnique.mockResolvedValue(null);

      await expect(service.updateTrip('user-1', 'trip-1', { title: 'New' } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for a VIEWER collaborator', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner' });
      prisma.tripCollaborator.findUnique.mockResolvedValue({ role: 'VIEWER' });

      await expect(service.updateTrip('user-1', 'trip-1', { title: 'New' } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows an EDITOR collaborator to update the trip', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner' });
      prisma.tripCollaborator.findUnique.mockResolvedValue({ role: 'EDITOR' });
      prisma.trip.update.mockResolvedValue({ id: 'trip-1', title: 'New' });

      const result = await service.updateTrip('user-1', 'trip-1', { title: 'New' } as any);

      expect(result.title).toBe('New');
    });
  });

  describe('deleteTrip', () => {
    it('throws NotFoundException when the trip does not exist', async () => {
      prisma.trip.findUnique.mockResolvedValue(null);

      await expect(service.deleteTrip('user-1', 'trip-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the caller is not the owner', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner' });

      await expect(service.deleteTrip('user-1', 'trip-1')).rejects.toThrow(ForbiddenException);
    });

    it('deletes the trip and decrements the owner trip count', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'user-1' });
      prisma.trip.delete.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.deleteTrip('user-1', 'trip-1');

      expect(result).toEqual({ deleted: true });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tripCount: { decrement: 1 } },
      });
    });
  });

  describe('locations CRUD', () => {
    const ownTrip = { id: 'trip-1', userId: 'user-1', privacy: 'PRIVATE', tags: ['japan'] };

    describe('addLocation', () => {
      it('throws ForbiddenException for a non-owner with no collaborator record', async () => {
        prisma.trip.findUnique.mockResolvedValue({ ...ownTrip, userId: 'owner' });
        prisma.tripCollaborator.findUnique.mockResolvedValue(null);

        await expect(
          service.addLocation('user-1', 'trip-1', { name: 'Kyoto', latitude: 35, longitude: 135 }),
        ).rejects.toThrow(ForbiddenException);
      });

      it('throws ForbiddenException for a VIEWER collaborator', async () => {
        prisma.trip.findUnique.mockResolvedValue({ ...ownTrip, userId: 'owner' });
        prisma.tripCollaborator.findUnique.mockResolvedValue({ role: 'VIEWER' });

        await expect(
          service.addLocation('user-1', 'trip-1', { name: 'Kyoto', latitude: 35, longitude: 135 }),
        ).rejects.toThrow(ForbiddenException);
      });

      it('allows an EDITOR collaborator and appends after the highest order', async () => {
        prisma.trip.findUnique.mockResolvedValue({ ...ownTrip, userId: 'owner' });
        prisma.tripCollaborator.findUnique.mockResolvedValue({ role: 'EDITOR' });
        prisma.tripLocation.aggregate.mockResolvedValue({ _max: { order: 2 } });
        prisma.tripLocation.create.mockResolvedValue({ id: 'loc-4', order: 3 });

        await service.addLocation('user-1', 'trip-1', { name: 'Kyoto', latitude: 35, longitude: 135 });

        const createArgs = prisma.tripLocation.create.mock.calls[0][0];
        expect(createArgs.data.order).toBe(3);
        expect(createArgs.data.theme).toBeDefined();
      });

      it('starts order at 0 for a trip with no locations', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.aggregate.mockResolvedValue({ _max: { order: null } });
        prisma.tripLocation.create.mockResolvedValue({ id: 'loc-1', order: 0 });

        await service.addLocation('user-1', 'trip-1', { name: 'Kyoto', latitude: 35, longitude: 135 });

        expect(prisma.tripLocation.create.mock.calls[0][0].data.order).toBe(0);
      });
    });

    describe('updateLocation', () => {
      it('404s for a location that belongs to another trip', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.findUnique.mockResolvedValue({ id: 'loc-1', tripId: 'other-trip' });

        await expect(
          service.updateLocation('user-1', 'trip-1', 'loc-1', { name: 'Osaka' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('updates only provided fields and recomputes theme when the name changes', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.findUnique.mockResolvedValue({
          id: 'loc-1',
          tripId: 'trip-1',
          name: 'Kyoto',
          country: 'JP',
        });
        prisma.tripLocation.update.mockResolvedValue({ id: 'loc-1' });

        await service.updateLocation('user-1', 'trip-1', 'loc-1', { name: 'Osaka' });

        const updateArgs = prisma.tripLocation.update.mock.calls[0][0];
        expect(updateArgs.data.name).toBe('Osaka');
        expect(updateArgs.data.theme).toBeDefined();
        expect(updateArgs.data.latitude).toBeUndefined();
      });

      it('does not recompute theme when only coordinates change', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.findUnique.mockResolvedValue({
          id: 'loc-1',
          tripId: 'trip-1',
          name: 'Kyoto',
          country: 'JP',
        });
        prisma.tripLocation.update.mockResolvedValue({ id: 'loc-1' });

        await service.updateLocation('user-1', 'trip-1', 'loc-1', { latitude: 35.01, longitude: 135.76 });

        expect(prisma.tripLocation.update.mock.calls[0][0].data.theme).toBeUndefined();
      });
    });

    describe('removeLocation', () => {
      it('404s for a location that belongs to another trip', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.findUnique.mockResolvedValue({ id: 'loc-1', tripId: 'other-trip' });

        await expect(service.removeLocation('user-1', 'trip-1', 'loc-1')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('deletes and re-compacts the order of remaining locations', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.findUnique.mockResolvedValue({ id: 'loc-2', tripId: 'trip-1' });
        prisma.tripLocation.delete.mockResolvedValue({});
        // After deleting the middle stop, orders 0 and 2 remain.
        prisma.tripLocation.findMany.mockResolvedValue([
          { id: 'loc-1', order: 0 },
          { id: 'loc-3', order: 2 },
        ]);

        const result = await service.removeLocation('user-1', 'trip-1', 'loc-2');

        expect(result).toEqual({ deleted: true });
        expect(prisma.tripLocation.delete).toHaveBeenCalledWith({ where: { id: 'loc-2' } });
        // Only the gap (loc-3: 2 -> 1) needs an update.
        expect(prisma.tripLocation.update).toHaveBeenCalledTimes(1);
        expect(prisma.tripLocation.update).toHaveBeenCalledWith({
          where: { id: 'loc-3' },
          data: { order: 1 },
        });
      });
    });

    describe('reorderLocations', () => {
      it('rejects an id set that does not match the trip exactly', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.findMany.mockResolvedValue([{ id: 'loc-1' }, { id: 'loc-2' }]);

        await expect(
          service.reorderLocations('user-1', 'trip-1', { locationIds: ['loc-1'] }),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.reorderLocations('user-1', 'trip-1', { locationIds: ['loc-1', 'loc-x'] }),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.reorderLocations('user-1', 'trip-1', { locationIds: ['loc-1', 'loc-1'] }),
        ).rejects.toThrow(BadRequestException);
      });

      it('writes order = index for the requested sequence', async () => {
        prisma.trip.findUnique.mockResolvedValue(ownTrip);
        prisma.tripLocation.findMany
          .mockResolvedValueOnce([{ id: 'loc-1' }, { id: 'loc-2' }])
          .mockResolvedValueOnce([{ id: 'loc-2' }, { id: 'loc-1' }]);
        prisma.tripLocation.update.mockResolvedValue({});

        await service.reorderLocations('user-1', 'trip-1', { locationIds: ['loc-2', 'loc-1'] });

        expect(prisma.tripLocation.update).toHaveBeenCalledWith({
          where: { id: 'loc-2' },
          data: { order: 0 },
        });
        expect(prisma.tripLocation.update).toHaveBeenCalledWith({
          where: { id: 'loc-1' },
          data: { order: 1 },
        });
      });
    });
  });

  describe('likeTrip / unlikeTrip', () => {
    it('throws ConflictException when liking an already-liked trip', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner', privacy: 'PUBLIC' });
      prisma.like.create.mockRejectedValue(uniqueConstraintError());

      await expect(service.likeTrip('user-1', 'trip-1')).rejects.toThrow(ConflictException);
    });

    it('does not mask a non-conflict DB error as ConflictException', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner', privacy: 'PUBLIC' });
      prisma.like.create.mockRejectedValue(new Error('connection lost'));

      await expect(service.likeTrip('user-1', 'trip-1')).rejects.toThrow('connection lost');
      await expect(service.likeTrip('user-1', 'trip-1')).rejects.not.toBeInstanceOf(ConflictException);
    });

    it('increments likesCount and notifies the owner on a new like', async () => {
      prisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        userId: 'owner',
        privacy: 'PUBLIC',
        title: 'Japan',
      });
      prisma.like.create.mockResolvedValue({});
      prisma.trip.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', displayName: 'Alice' });

      const result = await service.likeTrip('user-1', 'trip-1');

      expect(result).toEqual({ liked: true });
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { likesCount: { increment: 1 } },
      });
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'owner', type: 'like' }),
      );
    });

    it('does not notify when the owner likes their own trip', async () => {
      prisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        userId: 'user-1',
        privacy: 'PUBLIC',
        title: 'Japan',
      });
      prisma.like.create.mockResolvedValue({});
      prisma.trip.update.mockResolvedValue({});

      await service.likeTrip('user-1', 'trip-1');

      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('decrements likesCount only when a like actually existed', async () => {
      prisma.like.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.unlikeTrip('user-1', 'trip-1');

      expect(result).toEqual({ liked: false });
      expect(prisma.trip.update).not.toHaveBeenCalled();
    });

    it('decrements likesCount when a like was removed', async () => {
      prisma.like.deleteMany.mockResolvedValue({ count: 1 });
      prisma.trip.update.mockResolvedValue({});

      await service.unlikeTrip('user-1', 'trip-1');

      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { likesCount: { decrement: 1 } },
      });
    });
  });
});
