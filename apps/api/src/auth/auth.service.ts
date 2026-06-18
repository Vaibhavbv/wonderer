import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { SyncUserDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncUser(dto: SyncUserDto) {
    const user = await this.prisma.user.upsert({
      where: { clerkId: dto.clerkId },
      update: {
        email: dto.email,
        displayName: dto.displayName || undefined,
        avatarUrl: dto.avatarUrl || undefined,
      },
      create: {
        clerkId: dto.clerkId,
        email: dto.email,
        displayName: dto.displayName,
        username: dto.username,
        avatarUrl: dto.avatarUrl,
      },
    });

    return user;
  }
}
