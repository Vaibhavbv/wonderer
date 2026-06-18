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
