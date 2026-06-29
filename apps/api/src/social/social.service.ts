import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PUBLIC_PRIVACIES = ['PUBLIC', 'UNLISTED'] as const;

// Fields safe to expose on a public profile.
const publicUserSelect = {
  id: true,
  displayName: true,
  username: true,
  avatarUrl: true,
  bio: true,
  location: true,
  website: true,
  createdAt: true,
} as const;

// Trip shape for feed / profile cards.
const feedTripSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  startDate: true,
  endDate: true,
  tags: true,
  photosCount: true,
  likesCount: true,
  commentsCount: true,
  viewsCount: true,
  createdAt: true,
  coverPhoto: { select: { id: true, variants: true, originalUrl: true } },
  locations: { orderBy: { order: 'asc' as const }, select: { name: true, latitude: true, longitude: true, country: true, city: true, order: true } },
  user: { select: publicUserSelect },
} as const;

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async findUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('Profile not found');
    return user;
  }

  /** Public profile by username, including counts and (optionally) viewer relationship. */
  async getProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: publicUserSelect,
    });
    if (!user) throw new NotFoundException('Profile not found');

    const [tripsCount, followersCount, followingCount, totalLikes, isFollowing] = await Promise.all([
      this.prisma.trip.count({ where: { userId: user.id, status: 'PUBLISHED', privacy: { in: [...PUBLIC_PRIVACIES] } } }),
      this.prisma.follow.count({ where: { followingId: user.id } }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
      this.prisma.trip.aggregate({ where: { userId: user.id }, _sum: { likesCount: true } }).then((r) => r._sum.likesCount || 0),
      viewerId
        ? this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } } }).then(Boolean)
        : Promise.resolve(false),
    ]);

    return {
      ...user,
      stats: { tripsCount, followersCount, followingCount, totalLikes },
      isFollowing,
      isSelf: viewerId === user.id,
    };
  }

  /** Public, published trips for a profile, newest first. */
  async getProfileTrips(username: string, pagination: { cursor?: string; perPage: number }) {
    const user = await this.findUserByUsername(username);
    return this.paginatedTrips({
      userId: user.id,
      status: 'PUBLISHED',
      privacy: { in: [...PUBLIC_PRIVACIES] },
    }, pagination);
  }

  /** Home feed: published public trips from everyone the viewer follows, newest first. */
  async getFeed(viewerId: string, pagination: { cursor?: string; perPage: number }) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    const ids = following.map((f) => f.followingId);
    if (ids.length === 0) {
      return { items: [], nextCursor: null, empty: true };
    }
    return this.paginatedTrips({
      userId: { in: ids },
      status: 'PUBLISHED',
      privacy: { in: [...PUBLIC_PRIVACIES] },
    }, pagination);
  }

  /** Discovery: recent published public trips from everyone. */
  async getDiscover(pagination: { cursor?: string; perPage: number }) {
    return this.paginatedTrips({
      status: 'PUBLISHED',
      privacy: 'PUBLIC',
    }, pagination);
  }

  async follow(followerId: string, username: string) {
    const target = await this.findUserByUsername(username);
    if (target.id === followerId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    try {
      await this.prisma.follow.create({
        data: { followerId, followingId: target.id },
      });
    } catch (e) {
      throw new ConflictException('Already following this user');
    }

    const follower = await this.prisma.user.findUnique({ where: { id: followerId }, select: publicUserSelect });
    await this.notifications.create({
      userId: target.id,
      type: 'follow',
      title: 'New follower',
      body: `${follower?.displayName || follower?.username || 'Someone'} started following you`,
      data: { userId: followerId },
    });

    return { following: true };
  }

  async unfollow(followerId: string, username: string) {
    const target = await this.findUserByUsername(username);
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });
    return { following: false };
  }

  async getFollowers(username: string) {
    const user = await this.findUserByUsername(username);
    const follows = await this.prisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { follower: { select: publicUserSelect } },
    });
    return follows.map((f) => f.follower);
  }

  async getFollowing(username: string) {
    const user = await this.findUserByUsername(username);
    const follows = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { following: { select: publicUserSelect } },
    });
    return follows.map((f) => f.following);
  }

  /** Shared cursor-paginated trip query. */
  private async paginatedTrips(where: Record<string, unknown>, pagination: { cursor?: string; perPage: number }) {
    const trips = await this.prisma.trip.findMany({
      where,
      take: pagination.perPage + 1,
      ...(pagination.cursor && { skip: 1, cursor: { id: pagination.cursor } }),
      orderBy: { createdAt: 'desc' },
      select: feedTripSelect,
    });

    const hasMore = trips.length > pagination.perPage;
    const items = hasMore ? trips.slice(0, -1) : trips;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor };
  }
}
