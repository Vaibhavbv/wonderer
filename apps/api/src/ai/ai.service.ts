import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@prisma/prisma.service';
import { AIJobType, AIJobStatus } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ai-generation') private readonly aiQueue: Queue,
  ) {}

  async queueJob(userId: string, type: AIJobType, input: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.aiCreditsUsed >= user.aiCreditsQuota) {
      throw new ForbiddenException('AI credits exhausted. Upgrade your plan.');
    }

    // The processor reads the referenced trip/media wholesale (locations,
    // notes, dates) and returns the generated content in the job result, so
    // access MUST be checked here — the job id alone would otherwise let any
    // user run generation against any private trip.
    if (input.tripId) {
      await this.assertTripAccess(userId, input.tripId);
    }
    if (input.mediaId) {
      const media = await this.prisma.media.findUnique({ where: { id: input.mediaId } });
      if (!media) throw new NotFoundException('Media not found');
      if (media.userId !== userId) {
        throw new ForbiddenException('You do not have access to this media');
      }
    }

    const job = await this.prisma.aIJob.create({
      data: {
        userId,
        tripId: input.tripId,
        type,
        status: 'QUEUED',
        input,
      },
    });

    await this.aiQueue.add(type, {
      jobId: job.id,
      userId,
      tripId: input.tripId,
      type,
      input,
    }, {
      priority: user.subscriptionTier === 'voyager' ? 1 : user.subscriptionTier === 'explorer' ? 2 : 3,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { aiCreditsUsed: { increment: 1 } },
    });

    return {
      jobId: job.id,
      status: 'QUEUED',
      estimatedDuration: '15s',
    };
  }

  async getJobStatus(userId: string, jobId: string) {
    const job = await this.prisma.aIJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new ForbiddenException();
    return job;
  }

  // Generation is an authoring operation: owner or collaborator only. Mere
  // read access (a PUBLIC trip) does not let you spend credits on someone
  // else's trip and pull its full content through the job result.
  private async assertTripAccess(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId === userId) return;

    const collaborator = await this.prisma.tripCollaborator.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!collaborator) {
      throw new ForbiddenException('You do not have access to this trip');
    }
  }

  async getUserCreditUsage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { aiCreditsUsed: true, aiCreditsQuota: true },
    });
    return {
      used: user?.aiCreditsUsed || 0,
      quota: user?.aiCreditsQuota || 0,
      remaining: (user?.aiCreditsQuota || 0) - (user?.aiCreditsUsed || 0),
    };
  }
}
