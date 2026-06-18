import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getStory(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId && trip.privacy === 'PRIVATE') throw new ForbiddenException();

    let story = await this.prisma.story.findUnique({
      where: { tripId },
    });

    if (!story) {
      // Create default story
      story = await this.prisma.story.create({
        data: {
          tripId,
          template: 'cinematic-scroll',
          blocks: [
            {
              id: 'block_hero',
              type: 'hero',
              position: { x: 0, y: 0, w: 12, h: 6 },
              content: { title: trip.title, subtitle: '', overlayOpacity: 0.4 },
            },
          ],
          version: 1,
          lastEditedBy: userId,
        },
      });
    }

    return story;
  }

  async updateStory(userId: string, tripId: string, dto: any) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId) {
      const collab = await this.prisma.tripCollaborator.findUnique({
        where: { tripId_userId: { tripId, userId } },
      });
      if (!collab || collab.role === 'VIEWER') throw new ForbiddenException();
    }

    return this.prisma.story.upsert({
      where: { tripId },
      update: {
        template: dto.template,
        theme: dto.theme,
        blocks: dto.blocks,
        version: { increment: 1 },
        lastEditedBy: userId,
        lastEditedAt: new Date(),
      },
      create: {
        tripId,
        template: dto.template || 'cinematic-scroll',
        theme: dto.theme,
        blocks: dto.blocks,
        version: 1,
        lastEditedBy: userId,
      },
    });
  }
}
