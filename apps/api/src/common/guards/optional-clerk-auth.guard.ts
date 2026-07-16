import { Injectable, ExecutionContext } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';

/**
 * Auth for routes that serve both signed-in and anonymous visitors (e.g. a
 * shared PUBLIC/UNLISTED trip link). No Authorization header → proceed with
 * request.user = null. A header that IS present must still verify — an
 * invalid token 401s rather than silently downgrading an authed client to
 * anonymous.
 */
@Injectable()
export class OptionalClerkAuthGuard extends ClerkAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    return super.canActivate(context);
  }
}
