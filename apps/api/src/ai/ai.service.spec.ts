import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { PrismaService } from '@prisma/prisma.service';

describe('AiService', () => {
  let service: AiService;
  let prisma: {
    user: Record<string, jest.Mock>;
    trip: Record<string, jest.Mock>;
    tripCollaborator: Record<string, jest.Mock>;
    media: Record<string, jest.Mock>;
    aIJob: Record<string, jest.Mock>;
  };
  let queue: { add: jest.Mock };

  const userWithCredits = { id: 'user-1', aiCreditsUsed: 0, aiCreditsQuota: 10, subscriptionTier: 'free' };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      trip: { findUnique: jest.fn() },
      tripCollaborator: { findUnique: jest.fn() },
      media: { findUnique: jest.fn() },
      aIJob: { create: jest.fn(), findUnique: jest.fn() },
    };
    queue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken('ai-generation'), useValue: queue },
      ],
    }).compile();

    service = module.get(AiService);
  });

  describe('queueJob access control', () => {
    it('forbids generation against a trip the caller neither owns nor collaborates on', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithCredits);
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'victim', privacy: 'PRIVATE' });
      prisma.tripCollaborator.findUnique.mockResolvedValue(null);

      await expect(
        service.queueJob('user-1', 'GENERATE_STORY', { tripId: 'trip-1' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.aIJob.create).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('forbids generation even against a PUBLIC trip of another user (authoring op)', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithCredits);
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'victim', privacy: 'PUBLIC' });
      prisma.tripCollaborator.findUnique.mockResolvedValue(null);

      await expect(
        service.queueJob('user-1', 'GENERATE_STORY', { tripId: 'trip-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('404s when the referenced trip does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithCredits);
      prisma.trip.findUnique.mockResolvedValue(null);

      await expect(
        service.queueJob('user-1', 'GENERATE_STORY', { tripId: 'nope' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows the trip owner and enqueues the job', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithCredits);
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'user-1' });
      prisma.aIJob.create.mockResolvedValue({ id: 'job-1' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.queueJob('user-1', 'GENERATE_STORY', { tripId: 'trip-1' });

      expect(result.jobId).toBe('job-1');
      expect(queue.add).toHaveBeenCalled();
    });

    it('allows a collaborator on the trip', async () => {
      prisma.user.findUnique.mockResolvedValue(userWithCredits);
      prisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', userId: 'owner' });
      prisma.tripCollaborator.findUnique.mockResolvedValue({ role: 'EDITOR' });
      prisma.aIJob.create.mockResolvedValue({ id: 'job-1' });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.queueJob('user-1', 'GENERATE_STORY', { tripId: 'trip-1' }),
      ).resolves.toBeDefined();
    });

    it("forbids photo enhancement against another user's media", async () => {
      prisma.user.findUnique.mockResolvedValue(userWithCredits);
      prisma.media.findUnique.mockResolvedValue({ id: 'media-1', userId: 'victim' });

      await expect(
        service.queueJob('user-1', 'ENHANCE_PHOTO', { mediaId: 'media-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when AI credits are exhausted, before any access lookup', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userWithCredits, aiCreditsUsed: 10 });

      await expect(
        service.queueJob('user-1', 'GENERATE_STORY', { tripId: 'trip-1' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.trip.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('getJobStatus', () => {
    it("forbids reading another user's job", async () => {
      prisma.aIJob.findUnique.mockResolvedValue({ id: 'job-1', userId: 'other' });

      await expect(service.getJobStatus('user-1', 'job-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
