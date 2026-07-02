import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './comments.dto';

const commentUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getAccessibleTrip(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId && trip.privacy === 'PRIVATE') {
      throw new ForbiddenException('You do not have access to this trip');
    }
    return trip;
  }

  async create(userId: string, tripId: string, dto: CreateCommentDto) {
    const trip = await this.getAccessibleTrip(tripId, userId);

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.tripId !== tripId) {
        throw new BadRequestException('Parent comment not found on this trip');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        tripId,
        userId,
        content: dto.content,
        parentId: dto.parentId,
      },
      include: { user: { select: commentUserSelect } },
    });

    await this.prisma.trip.update({
      where: { id: tripId },
      data: { commentsCount: { increment: 1 } },
    });

    if (trip.userId !== userId) {
      await this.notifications.create({
        userId: trip.userId,
        type: 'comment',
        title: `${comment.user.displayName || comment.user.username || 'Someone'} commented on your trip`,
        body: dto.content.slice(0, 200),
        data: { tripId, userId, commentId: comment.id },
      });
    }

    return { ...comment, isLiked: false, replies: [] };
  }

  async list(userId: string, tripId: string, pagination: { cursor?: string; perPage: number }) {
    await this.getAccessibleTrip(tripId, userId);

    const topLevel = await this.prisma.comment.findMany({
      where: { tripId, parentId: null },
      take: pagination.perPage + 1,
      ...(pagination.cursor && { skip: 1, cursor: { id: pagination.cursor } }),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: commentUserSelect } },
    });

    const hasMore = topLevel.length > pagination.perPage;
    const items = hasMore ? topLevel.slice(0, -1) : topLevel;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    if (items.length === 0) {
      return { items: [], nextCursor: null };
    }

    const replies = await this.prisma.comment.findMany({
      where: { tripId, parentId: { in: items.map((c) => c.id) } },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: commentUserSelect } },
    });

    const allIds = [...items.map((c) => c.id), ...replies.map((c) => c.id)];
    const likes = await this.prisma.commentLike.findMany({
      where: { userId, commentId: { in: allIds } },
      select: { commentId: true },
    });
    const likedIds = new Set(likes.map((l) => l.commentId));

    const repliesByParent = new Map<string, typeof replies>();
    for (const reply of replies) {
      const list = repliesByParent.get(reply.parentId as string) || [];
      list.push(reply);
      repliesByParent.set(reply.parentId as string, list);
    }

    const withReplies = items.map((c) => ({
      ...c,
      isLiked: likedIds.has(c.id),
      replies: (repliesByParent.get(c.id) || []).map((r) => ({ ...r, isLiked: likedIds.has(r.id) })),
    }));

    return { items: withReplies, nextCursor };
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const trip = await this.prisma.trip.findUnique({ where: { id: comment.tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    if (comment.userId !== userId && trip.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    const replies = await this.prisma.comment.findMany({ where: { parentId: commentId }, select: { id: true } });
    const deletedCount = 1 + replies.length;

    if (replies.length > 0) {
      await this.prisma.comment.deleteMany({ where: { id: { in: replies.map((r) => r.id) } } });
    }
    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.prisma.trip.update({
      where: { id: comment.tripId },
      data: { commentsCount: { decrement: deletedCount } },
    });

    return { deleted: true };
  }

  async like(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    try {
      await this.prisma.commentLike.create({ data: { commentId, userId } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Already liked this comment');
      }
      throw e;
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { likesCount: { increment: 1 } },
    });

    if (comment.userId !== userId) {
      await this.notifications.create({
        userId: comment.userId,
        type: 'like',
        title: 'Someone liked your comment',
        body: comment.content.slice(0, 200),
        data: { tripId: comment.tripId, userId, commentId },
      });
    }

    return { liked: true };
  }

  async unlike(userId: string, commentId: string) {
    const result = await this.prisma.commentLike.deleteMany({ where: { commentId, userId } });
    if (result.count > 0) {
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } },
      });
    }
    return { liked: false };
  }
}
