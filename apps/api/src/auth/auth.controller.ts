import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SyncUserDto } from './auth.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync Clerk user to local database' })
  async syncUser(@Body() dto: SyncUserDto) {
    return this.authService.syncUser(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe() {
    // Handled by Clerk middleware
    return { message: 'Use /v1/users/me' };
  }
}
