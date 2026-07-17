import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
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

    // CLERK_AUTHORIZED_PARTIES (comma-separated origins) binds tokens to this
    // app's frontends via the azp claim, so a token minted for another app on
    // the same Clerk instance can't be replayed here. Unset = check skipped.
    const authorizedParties = this.configService
      .get<string>('CLERK_AUTHORIZED_PARTIES', '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    let clerkId: string;
    let email: string | undefined;
    try {
      const payload = await verifyToken(token, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
        ...(authorizedParties.length > 0 && { authorizedParties }),
        // Not validating against a specific issuer (same as omitting the
        // option) — only required by the type signature, not by runtime
        // behavior: verifyJwt() skips the issuer check unless `issuer` is a
        // string or function.
        issuer: null,
      });

      clerkId = payload.sub;
      email = (payload as Record<string, unknown>).email as string | undefined;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Resolve the Clerk user to our DB user, auto-provisioning on first
    // authenticated request so a profile exists immediately after sign-up.
    // request.user.id must be the DB User.id (cuid) — every authed query
    // keys off it — NOT the Clerk id (payload.sub).
    // DB errors here must NOT be masked as 401s (the token already verified),
    // hence the upsert lives outside the try/catch above.
    let user;
    try {
      user = await this.prisma.user.upsert({
        where: { clerkId },
        update: {},
        create: {
          clerkId,
          email: email ?? `${clerkId}@placeholder.wanderverse.app`,
        },
      });
    } catch (error) {
      // The email claim isn't unique across Clerk users (or a stale row holds
      // it). Fall back to the collision-proof placeholder rather than locking
      // the second account out of the API entirely.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`Email collision provisioning ${clerkId}; using placeholder email`);
        user = await this.prisma.user.upsert({
          where: { clerkId },
          update: {},
          create: {
            clerkId,
            email: `${clerkId}@placeholder.wanderverse.app`,
          },
        });
      } else {
        throw error;
      }
    }

    request.user = {
      id: user.id,
      clerkId,
      email: user.email,
    };

    return true;
  }
}
