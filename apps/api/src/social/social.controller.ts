import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Pagination } from '@common/decorators/pagination.decorator';

// Public, unauthenticated discovery + profile endpoints. These power the
// SEO'd public pages, so they must NOT be behind the auth guard.
@ApiTags('Social')
@Controller({ version: '1' })
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('discover')
  @ApiOperation({ summary: 'Recent public trips from everyone' })
  async discover(@Pagination() pagination: { cursor?: string; perPage: number }) {
    return this.socialService.getDiscover(pagination);
  }

  @Get('profiles/:username')
  @ApiOperation({ summary: 'Public profile by username' })
  async getProfile(@Param('username') username: string) {
    return this.socialService.getProfile(username);
  }

  @Get('profiles/:username/trips')
  @ApiOperation({ summary: 'Public published trips for a profile' })
  async getProfileTrips(
    @Param('username') username: string,
    @Pagination() pagination: { cursor?: string; perPage: number },
  ) {
    return this.socialService.getProfileTrips(username, pagination);
  }

  @Get('profiles/:username/followers')
  @ApiOperation({ summary: 'Followers of a profile' })
  async getFollowers(@Param('username') username: string) {
    return this.socialService.getFollowers(username);
  }

  @Get('profiles/:username/following')
  @ApiOperation({ summary: 'Accounts a profile follows' })
  async getFollowing(@Param('username') username: string) {
    return this.socialService.getFollowing(username);
  }
}

// Authenticated social actions + personalized feed.
@ApiTags('Social')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ version: '1' })
export class FeedController {
  constructor(private readonly socialService: SocialService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Home feed: trips from people you follow' })
  async feed(
    @CurrentUser('id') userId: string,
    @Pagination() pagination: { cursor?: string; perPage: number },
  ) {
    return this.socialService.getFeed(userId, pagination);
  }

  @Get('profiles/:username/relationship')
  @ApiOperation({ summary: 'Whether the current user follows this profile' })
  async relationship(
    @CurrentUser('id') userId: string,
    @Param('username') username: string,
  ) {
    const profile = await this.socialService.getProfile(username, userId);
    return { isFollowing: profile.isFollowing, isSelf: profile.isSelf };
  }

  @Post('profiles/:username/follow')
  @ApiOperation({ summary: 'Follow a user' })
  async follow(@CurrentUser('id') userId: string, @Param('username') username: string) {
    return this.socialService.follow(userId, username);
  }

  @Delete('profiles/:username/follow')
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollow(@CurrentUser('id') userId: string, @Param('username') username: string) {
    return this.socialService.unfollow(userId, username);
  }
}
