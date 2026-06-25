import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
        issuer: (issuer: string) => issuer.startsWith('https://clerk.'),
      });

      const clerkId = payload.sub;

      // Resolve the Clerk user to our DB user, auto-provisioning on first
      // authenticated request so a profile exists immediately after sign-up.
      // request.user.id must be the DB User.id (cuid) — every authed query
      // keys off it — NOT the Clerk id (payload.sub).
      const email = (payload as Record<string, unknown>).email as string | undefined;
      const user = await this.prisma.user.upsert({
        where: { clerkId },
        update: {},
        create: {
          clerkId,
          email: email ?? `${clerkId}@placeholder.wanderverse.app`,
        },
      });

      request.user = {
        id: user.id,
        clerkId,
        email: user.email,
      };

      return true;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
