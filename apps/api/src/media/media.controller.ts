import { Controller, Post, Get, Patch, Delete, Body, Param, ParseArrayPipe, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Pagination } from '@common/decorators/pagination.decorator';
import { PresignedUrlDto, UpdateMediaDto } from './media.dto';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get S3 presigned upload URL' })
  async getPresignedUrl(@CurrentUser('id') userId: string, @Body() dto: PresignedUrlDto) {
    return this.mediaService.getPresignedUrl(userId, dto);
  }

  @Post('batch-presigned-urls')
  @ApiOperation({ summary: 'Get batch S3 presigned URLs' })
  async getBatchPresignedUrls(
    @CurrentUser('id') userId: string,
    // The global ValidationPipe skips top-level arrays; without ParseArrayPipe
    // the element decorators never run.
    @Body(new ParseArrayPipe({ items: PresignedUrlDto, whitelist: true, forbidNonWhitelisted: true }))
    dtos: PresignedUrlDto[],
  ) {
    return this.mediaService.getBatchPresignedUrls(userId, dtos);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a completed S3 upload (counts it and charges storage)' })
  async confirmUpload(@CurrentUser('id') userId: string, @Param('id') mediaId: string) {
    return this.mediaService.confirmUpload(userId, mediaId);
  }

  @Get('trip/:tripId')
  @ApiOperation({ summary: 'List media for a trip' })
  async listMedia(
    @CurrentUser('id') userId: string,
    @Param('tripId') tripId: string,
    @Pagination() pagination: { cursor?: string; perPage: number; sort: string },
  ) {
    return this.mediaService.listMedia(userId, tripId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media metadata' })
  async getMedia(@CurrentUser('id') userId: string, @Param('id') mediaId: string) {
    return this.mediaService.getMedia(userId, mediaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata' })
  async updateMedia(
    @CurrentUser('id') userId: string,
    @Param('id') mediaId: string,
    @Body() dto: UpdateMediaDto,
  ) {
    return this.mediaService.updateMedia(userId, mediaId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete media' })
  async deleteMedia(@CurrentUser('id') userId: string, @Param('id') mediaId: string) {
    return this.mediaService.deleteMedia(userId, mediaId);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Trigger media reprocessing / AI enhancement' })
  async processMedia(@CurrentUser('id') userId: string, @Param('id') mediaId: string) {
    return this.mediaService.processMedia(userId, mediaId);
  }
}
