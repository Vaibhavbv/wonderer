import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Pagination } from '@common/decorators/pagination.decorator';
import { CreateCommentDto } from './comments.dto';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ version: '1' })
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('trips/:tripId/comments')
  @ApiOperation({ summary: 'Add a comment (or reply) to a trip' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('tripId') tripId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, tripId, dto);
  }

  @Get('trips/:tripId/comments')
  @ApiOperation({ summary: 'List comments on a trip, threaded' })
  async list(
    @CurrentUser('id') userId: string,
    @Param('tripId') tripId: string,
    @Pagination() pagination: { cursor?: string; perPage: number },
  ) {
    const { items, nextCursor } = await this.commentsService.list(userId, tripId, pagination);
    return { data: items, meta: { nextCursor } };
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete a comment (author or trip owner)' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.commentsService.remove(userId, id);
  }

  @Post('comments/:id/like')
  @ApiOperation({ summary: 'Like a comment' })
  async like(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.commentsService.like(userId, id);
  }

  @Delete('comments/:id/like')
  @ApiOperation({ summary: 'Unlike a comment' })
  async unlike(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.commentsService.unlike(userId, id);
  }
}
