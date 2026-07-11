import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '@prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('create', () => {
    it('passes through provided data as InputJsonValue', async () => {
      prisma.notification.create.mockResolvedValue({});

      await service.create({
        userId: 'user-1',
        type: 'like',
        title: 'Title',
        body: 'Body',
        data: { tripId: 'trip-1' },
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'like',
          title: 'Title',
          body: 'Body',
          data: { tripId: 'trip-1' },
        },
      });
    });

    it('uses Prisma.JsonNull when no data is provided', async () => {
      prisma.notification.create.mockResolvedValue({});

      await service.create({ userId: 'user-1', type: 'follow', title: 'Title', body: 'Body' });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'follow',
          title: 'Title',
          body: 'Body',
          data: Prisma.JsonNull,
        },
      });
    });
  });

  describe('list', () => {
    it('paginates and reports unreadCount alongside items', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }]);
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.list('user-1', { perPage: 10 });

      expect(result).toEqual({ items: [{ id: 'n1' }, { id: 'n2' }], nextCursor: null, unreadCount: 3 });
      expect(prisma.notification.count).toHaveBeenCalledWith({ where: { userId: 'user-1', read: false } });
    });

    it('computes nextCursor when more results exist than perPage', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }]);
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.list('user-1', { perPage: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('n2');
    });
  });

  describe('markRead', () => {
    it('throws NotFoundException when the notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markRead('user-1', 'n1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the notification belongs to someone else', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'someone-else' });

      await expect(service.markRead('user-1', 'n1')).rejects.toThrow(ForbiddenException);
    });

    it('marks the notification as read for its owner', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'user-1' });
      prisma.notification.update.mockResolvedValue({ id: 'n1', read: true });

      const result = await service.markRead('user-1', 'n1');

      expect(result).toEqual({ id: 'n1', read: true });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { read: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('markAllRead', () => {
    it('updates all unread notifications for the user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllRead('user-1');

      expect(result).toEqual({ updated: true });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true, readAt: expect.any(Date) },
      });
    });
  });
});
