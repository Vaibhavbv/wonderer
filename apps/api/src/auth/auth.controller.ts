import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SyncUserDto } from './auth.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Auth')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @ApiOperation({ summary: "Sync the authenticated Clerk user's profile fields to the local database" })
  async syncUser(@CurrentUser('clerkId') clerkId: string, @Body() dto: SyncUserDto) {
    // clerkId is taken from the verified JWT, never from the request body,
    // so a caller can only ever sync their own record.
    return this.authService.syncUser(clerkId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe() {
    // Handled by Clerk middleware
    return { message: 'Use /v1/users/me' };
  }
}
