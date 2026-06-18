import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UpdateProfileDto } from './users.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  async updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.usersService.getStats(userId);
  }

  @Get('me/subscription')
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@CurrentUser('id') userId: string) {
    return this.usersService.getSubscription(userId);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete user account (GDPR)' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }
}
