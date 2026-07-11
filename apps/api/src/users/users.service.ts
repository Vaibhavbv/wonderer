import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { UpdateProfileDto } from './users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        location: true,
        website: true,
        timezone: true,
        language: true,
        unitSystem: true,
        emailNotifications: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        storageUsedBytes: true,
        storageQuotaBytes: true,
        aiCreditsUsed: true,
        aiCreditsQuota: true,
        tripCount: true,
        tripQuota: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.displayName !== undefined && { displayName: dto.displayName }),
          ...(dto.username !== undefined && { username: dto.username }),
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.location !== undefined && { location: dto.location }),
          ...(dto.website !== undefined && { website: dto.website }),
          ...(dto.timezone !== undefined && { timezone: dto.timezone }),
          ...(dto.language !== undefined && { language: dto.language }),
          ...(dto.unitSystem !== undefined && { unitSystem: dto.unitSystem }),
          ...(dto.emailNotifications !== undefined && { emailNotifications: dto.emailNotifications }),
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        },
      });
    } catch (e) {
      // username has a unique index — surface a taken handle as 409, not 500.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('That username is already taken');
      }
      throw e;
    }
  }

  async getStats(userId: string) {
    const [tripsCount, mediaCount, followersCount, followingCount, totalViews] = await Promise.all([
      this.prisma.trip.count({ where: { userId } }),
      this.prisma.media.count({ where: { userId } }),
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.trip.aggregate({
        where: { userId },
        _sum: { viewsCount: true },
      }).then((r) => r._sum.viewsCount || 0),
    ]);

    return {
      tripsCount,
      mediaCount,
      followersCount,
      followingCount,
      totalViews,
    };
  }

  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteAccount(userId: string) {
    // GDPR-compliant deletion: cascade all related data
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }
}
