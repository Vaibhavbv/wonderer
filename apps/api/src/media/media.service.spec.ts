import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { PrismaService } from '@prisma/prisma.service';

describe('MediaService', () => {
  let service: MediaService;
  let prisma: {
    user: Record<string, jest.Mock>;
    trip: Record<string, jest.Mock>;
    tripCollaborator: Record<string, jest.Mock>;
    media: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let s3Send: jest.Mock;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      trip: { findUnique: jest.fn(), update: jest.fn() },
      tripCollaborator: { findUnique: jest.fn() },
      media: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (arg: unknown) =>
      typeof arg === 'function' ? arg(prisma) : Promise.all(arg as Promise<unknown>[]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: (_k: string, d?: string) => d ?? '' } },
      ],
    }).compile();

    service = module.get(MediaService);
    s3Send = jest.fn().mockResolvedValue({});
    (service as unknown as { s3Client: { send: jest.Mock } }).s3Client = { send: s3Send };
  });

  describe('getPresignedUrl access control', () => {
    const dto = { filename: 'a.jpg', contentType: 'image/jpeg', fileSize: 100, tripId: 'trip-1' };

    it("forbids uploading to another user's trip", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        storageUsedBytes: BigInt(0),
        storageQuotaBytes: BigInt(1000000),
      });
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'victim' });
      prisma.tripCollaborator.findUnique.mockResolvedValue(null);

      await expect(service.getPresignedUrl('user-1', dto)).rejects.toThrow(ForbiddenException);
      expect(prisma.media.create).not.toHaveBeenCalled();
    });

    it('forbids a VIEWER collaborator from uploading', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        storageUsedBytes: BigInt(0),
        storageQuotaBytes: BigInt(1000000),
      });
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner' });
      prisma.tripCollaborator.findUnique.mockResolvedValue({ role: 'VIEWER' });

      await expect(service.getPresignedUrl('user-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('404s when the trip does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        storageUsedBytes: BigInt(0),
        storageQuotaBytes: BigInt(1000000),
      });
      prisma.trip.findUnique.mockResolvedValue(null);

      await expect(service.getPresignedUrl('user-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmUpload', () => {
    it('counts the photo, flips status, and charges storage', async () => {
      prisma.media.findUnique.mockResolvedValue({
        id: 'media-1',
        userId: 'user-1',
        tripId: 'trip-1',
        type: 'IMAGE',
        fileSize: BigInt(500),
        processingStatus: 'uploading',
      });
      prisma.media.update.mockResolvedValue({ id: 'media-1', processingStatus: 'completed' });

      await service.confirmUpload('user-1', 'media-1');

      expect(prisma.media.update).toHaveBeenCalledWith({
        where: { id: 'media-1' },
        data: { processingStatus: 'completed' },
      });
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { photosCount: { increment: 1 } },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { storageUsedBytes: { increment: BigInt(500) } },
      });
    });

    it('is idempotent — a second confirm is a no-op', async () => {
      prisma.media.findUnique.mockResolvedValue({
        id: 'media-1',
        userId: 'user-1',
        tripId: 'trip-1',
        type: 'IMAGE',
        fileSize: BigInt(500),
        processingStatus: 'completed',
      });

      await service.confirmUpload('user-1', 'media-1');

      expect(prisma.media.update).not.toHaveBeenCalled();
      expect(prisma.trip.update).not.toHaveBeenCalled();
    });

    it("forbids confirming another user's media", async () => {
      prisma.media.findUnique.mockResolvedValue({ id: 'media-1', userId: 'other' });

      await expect(service.confirmUpload('user-1', 'media-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteMedia', () => {
    it('decrements counters and storage only for confirmed media, and cleans up S3', async () => {
      prisma.media.findUnique.mockResolvedValue({
        id: 'media-1',
        userId: 'user-1',
        tripId: 'trip-1',
        type: 'IMAGE',
        fileSize: BigInt(500),
        processingStatus: 'completed',
        originalUrl: 'https://cdn.wanderverse.com/uploads/user-1/2026/7/media-1.jpg',
      });
      prisma.media.delete.mockResolvedValue({});

      await service.deleteMedia('user-1', 'media-1');

      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { photosCount: { decrement: 1 } },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { storageUsedBytes: { decrement: BigInt(500) } },
      });
      expect(s3Send).toHaveBeenCalled();
    });

    it('gives nothing back for an unconfirmed (abandoned) upload', async () => {
      prisma.media.findUnique.mockResolvedValue({
        id: 'media-1',
        userId: 'user-1',
        tripId: 'trip-1',
        type: 'IMAGE',
        fileSize: BigInt(500),
        processingStatus: 'uploading',
        originalUrl: 'https://cdn.wanderverse.com/uploads/user-1/2026/7/media-1.jpg',
      });
      prisma.media.delete.mockResolvedValue({});

      await service.deleteMedia('user-1', 'media-1');

      expect(prisma.trip.update).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
