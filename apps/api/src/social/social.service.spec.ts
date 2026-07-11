import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SocialService } from './social.service';
import { PrismaService } from '@prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const uniqueConstraintError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.2.1',
  });

describe('SocialService', () => {
  let service: SocialService;
  let prisma: {
    user: Record<string, jest.Mock>;
    trip: Record<string, jest.Mock>;
    follow: Record<string, jest.Mock>;
  };
  let notifications: { create: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      trip: { count: jest.fn(), aggregate: jest.fn(), findMany: jest.fn() },
      follow: {
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
    };
    notifications = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(SocialService);
  });

  describe('follow', () => {
    it('throws NotFoundException when the target profile does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.follow('user-1', 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when following yourself', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'user-1' });

      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when already following', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'target', username: 'target' });
      prisma.follow.create.mockRejectedValue(uniqueConstraintError());

      await expect(service.follow('user-1', 'target')).rejects.toThrow(ConflictException);
    });

    it('does not mask a non-conflict DB error as ConflictException', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'target', username: 'target' });
      prisma.follow.create.mockRejectedValue(new Error('connection lost'));

      await expect(service.follow('user-1', 'target')).rejects.toThrow('connection lost');
      await expect(service.follow('user-1', 'target')).rejects.not.toBeInstanceOf(ConflictException);
    });

    it('creates a follow record and notifies the target', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'target', username: 'target' })
        .mockResolvedValueOnce({ id: 'user-1', displayName: 'Alice', username: 'alice' });
      prisma.follow.create.mockResolvedValue({});

      const result = await service.follow('user-1', 'target');

      expect(result).toEqual({ following: true });
      expect(prisma.follow.create).toHaveBeenCalledWith({
        data: { followerId: 'user-1', followingId: 'target' },
      });
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'target', type: 'follow' }),
      );
    });
  });

  describe('unfollow', () => {
    it('throws NotFoundException when the target profile does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.unfollow('user-1', 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('is idempotent: returns following:false even if no follow existed', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'target', username: 'target' });
      prisma.follow.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.unfollow('user-1', 'target');

      expect(result).toEqual({ following: false });
      expect(prisma.follow.deleteMany).toHaveBeenCalledWith({
        where: { followerId: 'user-1', followingId: 'target' },
      });
    });
  });

  describe('getProfile', () => {
    it('throws NotFoundException when the profile does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('ghost')).rejects.toThrow(NotFoundException);
    });

    it('aggregates stats and reports isSelf/isFollowing correctly', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'user-1' });
      prisma.trip.count
        .mockResolvedValueOnce(3) // tripsCount
        .mockResolvedValueOnce(0); // unused fallback, no-op
      prisma.follow.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      prisma.trip.aggregate.mockResolvedValue({ _sum: { likesCount: 42 } });
      prisma.follow.findUnique.mockResolvedValue({ followerId: 'viewer-1', followingId: 'user-1' });

      const result = await service.getProfile('user-1', 'viewer-1');

      expect(result.stats).toEqual({
        tripsCount: 3,
        followersCount: 5,
        followingCount: 2,
        totalLikes: 42,
      });
      expect(result.isFollowing).toBe(true);
      expect(result.isSelf).toBe(false);
    });

    it('reports isSelf true when the viewer is the profile owner', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'user-1' });
      prisma.trip.count.mockResolvedValue(0);
      prisma.follow.count.mockResolvedValue(0);
      prisma.trip.aggregate.mockResolvedValue({ _sum: { likesCount: null } });
      prisma.follow.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('user-1', 'user-1');

      expect(result.isSelf).toBe(true);
      expect(result.isFollowing).toBe(false);
      expect(result.stats.totalLikes).toBe(0);
    });
  });

  describe('getFeed', () => {
    it('returns an empty feed when the viewer follows no one', async () => {
      prisma.follow.findMany.mockResolvedValue([]);

      const result = await service.getFeed('user-1', { perPage: 10 });

      expect(result).toEqual({ items: [], nextCursor: null, empty: true });
      expect(prisma.trip.findMany).not.toHaveBeenCalled();
    });

    it('queries trips from followed users when following list is non-empty', async () => {
      prisma.follow.findMany.mockResolvedValue([{ followingId: 'a' }, { followingId: 'b' }]);
      prisma.trip.findMany.mockResolvedValue([]);

      await service.getFeed('user-1', { perPage: 10 });

      const where = prisma.trip.findMany.mock.calls[0][0].where;
      expect(where.userId).toEqual({ in: ['a', 'b'] });
    });
  });
});
