import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { GenerateStoryDto, GenerateTitleDto, EnhancePhotoDto } from './ai.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-story')
  @ApiOperation({ summary: 'Generate AI story from trip data' })
  async generateStory(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateStoryDto,
  ) {
    return this.aiService.queueJob(userId, 'GENERATE_STORY', dto);
  }

  @Post('generate-title')
  @ApiOperation({ summary: 'Generate trip title suggestions' })
  async generateTitle(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateTitleDto,
  ) {
    return this.aiService.queueJob(userId, 'GENERATE_TITLE', dto);
  }

  @Post('enhance-photo')
  @ApiOperation({ summary: 'AI photo enhancement' })
  async enhancePhoto(
    @CurrentUser('id') userId: string,
    @Body() dto: EnhancePhotoDto,
  ) {
    return this.aiService.queueJob(userId, 'ENHANCE_PHOTO', dto);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get AI job status' })
  async getJobStatus(@CurrentUser('id') userId: string, @Param('id') jobId: string) {
    return this.aiService.getJobStatus(userId, jobId);
  }
}
