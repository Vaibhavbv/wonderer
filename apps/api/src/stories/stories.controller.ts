import { Controller, Get, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { UpdateStoryDto } from './stories.dto';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ path: 'trips', version: '1' })
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get(':tripId/story')
  @ApiOperation({ summary: 'Get story layout for trip' })
  async getStory(@CurrentUser('id') userId: string, @Param('tripId') tripId: string) {
    return this.storiesService.getStory(userId, tripId);
  }

  @Put(':tripId/story')
  @ApiOperation({ summary: 'Update story layout (full replace)' })
  async updateStory(
    @CurrentUser('id') userId: string,
    @Param('tripId') tripId: string,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storiesService.updateStory(userId, tripId, dto);
  }
}
