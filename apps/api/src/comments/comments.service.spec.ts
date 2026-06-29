import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '@prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: {
    trip: Record<string, jest.Mock>;
    comment: Record<string, jest.Mock>;
    commentLike: Record<string, jest.Mock>;
  };
  let notifications: { create: jest.Mock };

  beforeEach(async () => {
    prisma = {
      trip: { findUnique: jest.fn(), update: jest.fn() },
      comment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      },
      commentLike: { create: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn() },
    };
    notifications = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  describe('create', () => {
    it('throws NotFoundException when the trip does not exist', async () => {
      prisma.trip.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', 'trip-1', { content: 'hi' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for a private trip the caller does not own', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner', privacy: 'PRIVATE' });

      await expect(service.create('user-1', 'trip-1', { content: 'hi' } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when parentId belongs to a different trip', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner', privacy: 'PUBLIC' });
      prisma.comment.findUnique.mockResolvedValue({ id: 'parent-1', tripId: 'other-trip' });

      await expect(
        service.create('user-1', 'trip-1', { content: 'hi', parentId: 'parent-1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a top-level comment, increments commentsCount, and notifies the trip owner', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner', privacy: 'PUBLIC' });
      prisma.comment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'hi',
        user: { id: 'user-1', displayName: 'Alice', username: 'alice' },
      });
      prisma.trip.update.mockResolvedValue({});

      const result = await service.create('user-1', 'trip-1', { content: 'hi' } as any);

      expect(result).toEqual(
        expect.objectContaining({ id: 'comment-1', isLiked: false, replies: [] }),
      );
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { commentsCount: { increment: 1 } },
      });
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'owner', type: 'comment' }),
      );
    });

    it('does not notify when the trip owner comments on their own trip', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'user-1', privacy: 'PUBLIC' });
      prisma.comment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'hi',
        user: { id: 'user-1', displayName: 'Alice', username: 'alice' },
      });
      prisma.trip.update.mockResolvedValue({});

      await service.create('user-1', 'trip-1', { content: 'hi' } as any);

      expect(notifications.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns an empty result with no extra queries when there are no top-level comments', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner', privacy: 'PUBLIC' });
      prisma.comment.findMany.mockResolvedValue([]);

      const result = await service.list('user-1', 'trip-1', { perPage: 10 });

      expect(result).toEqual({ items: [], nextCursor: null });
      expect(prisma.commentLike.findMany).not.toHaveBeenCalled();
    });

    it('attaches replies and isLiked flags to top-level comments', async () => {
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner', privacy: 'PUBLIC' });
      prisma.comment.findMany.mockResolvedValue([{ id: 'c1' }]);
      (prisma.comment.findMany as jest.Mock).mockResolvedValueOnce([{ id: 'c1' }]).mockResolvedValueOnce([
        { id: 'r1', parentId: 'c1' },
      ]);
      prisma.commentLike.findMany.mockResolvedValue([{ commentId: 'c1' }]);

      const result = await service.list('user-1', 'trip-1', { perPage: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isLiked).toBe(true);
      expect(result.items[0].replies).toEqual([
        expect.objectContaining({ id: 'r1', isLiked: false }),
      ]);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the comment does not exist', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.remove('user-1', 'comment-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the caller is neither the author nor trip owner', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'comment-1', userId: 'someone-else', tripId: 'trip-1' });
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner' });

      await expect(service.remove('user-1', 'comment-1')).rejects.toThrow(ForbiddenException);
    });

    it('allows the trip owner to delete someone else comment and cascades to replies', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'comment-1', userId: 'author', tripId: 'trip-1' });
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'user-1' });
      prisma.comment.findMany.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
      prisma.comment.deleteMany.mockResolvedValue({ count: 2 });
      prisma.comment.delete.mockResolvedValue({});
      prisma.trip.update.mockResolvedValue({});

      const result = await service.remove('user-1', 'comment-1');

      expect(result).toEqual({ deleted: true });
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { commentsCount: { decrement: 3 } },
      });
    });
  });

  describe('like / unlike', () => {
    it('throws NotFoundException when liking a comment that does not exist', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.like('user-1', 'comment-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when liking an already-liked comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'comment-1', userId: 'owner' });
      prisma.commentLike.create.mockRejectedValue(new Error('unique constraint'));

      await expect(service.like('user-1', 'comment-1')).rejects.toThrow(ConflictException);
    });

    it('increments likesCount and notifies the comment author', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'comment-1', userId: 'author', content: 'hi' });
      prisma.commentLike.create.mockResolvedValue({});
      prisma.comment.update.mockResolvedValue({});

      const result = await service.like('user-1', 'comment-1');

      expect(result).toEqual({ liked: true });
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'author', type: 'like' }),
      );
    });

    it('decrements likesCount only when a like actually existed', async () => {
      prisma.commentLike.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.unlike('user-1', 'comment-1');

      expect(result).toEqual({ liked: false });
      expect(prisma.comment.update).not.toHaveBeenCalled();
    });
  });
});
