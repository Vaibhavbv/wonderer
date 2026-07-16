import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PresignedUrlDto, UpdateMediaDto } from './media.dto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async getPresignedUrl(userId: string, dto: PresignedUrlDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // dto.tripId is client-supplied: without this check any user could attach
    // media rows to any other user's trip (and inflate its media counters).
    await this.assertCanUploadToTrip(userId, dto.tripId);

    const estimatedNewSize = user.storageUsedBytes + BigInt(dto.fileSize || 0);
    if (estimatedNewSize > user.storageQuotaBytes) {
      throw new ForbiddenException('Storage quota exceeded. Upgrade your plan.');
    }

    const mediaId = `media_${uuidv4().replace(/-/g, '')}`;
    const ext = mime.extension(dto.contentType) || 'bin';
    const key = `uploads/${userId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${mediaId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.configService.get('S3_BUCKET_NAME', 'wanderverse-media'),
      Key: key,
      ContentType: dto.contentType,
      ContentLength: dto.fileSize,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    const cdnUrl = `https://cdn.wanderverse.com/${key}`;

    const mediaType = dto.contentType.startsWith('video')
      ? 'VIDEO'
      : dto.contentType.startsWith('audio')
        ? 'AUDIO'
        : 'IMAGE';

    // The media row and the trip's denormalized counters move together.
    await this.prisma.$transaction(async (tx) => {
      await tx.media.create({
        data: {
          id: mediaId,
          tripId: dto.tripId,
          userId,
          type: mediaType,
          mimeType: dto.contentType,
          filename: dto.filename,
          originalUrl: cdnUrl,
          fileSize: BigInt(dto.fileSize || 0),
          processingStatus: 'uploading',
        },
      });

      if (mediaType === 'IMAGE' || mediaType === 'VIDEO') {
        await tx.trip.update({
          where: { id: dto.tripId },
          data: mediaType === 'VIDEO' ? { videosCount: { increment: 1 } } : { photosCount: { increment: 1 } },
        });
      }
    });

    return {
      mediaId,
      uploadUrl,
      uploadFields: { key },
      publicUrl: cdnUrl,
      expiresAt: new Date(Date.now() + 900000).toISOString(),
    };
  }

  async getBatchPresignedUrls(userId: string, dtos: PresignedUrlDto[]) {
    if (dtos.length > 50) throw new BadRequestException('Maximum 50 files per batch');
    const results = await Promise.all(dtos.map((dto) => this.getPresignedUrl(userId, dto)));
    return { data: results, count: results.length };
  }

  async listMedia(
    userId: string,
    tripId: string,
    pagination: { cursor?: string; perPage: number; sort: string },
  ) {
    const sortMap: Record<string, string> = {
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      order: 'order',
    };
    const [rawField, rawOrder] = pagination.sort.split(':');
    const sortField = sortMap[rawField] ?? 'createdAt';
    const sortOrder = rawOrder === 'asc' ? 'asc' : 'desc';
    const media = await this.prisma.media.findMany({
      where: { tripId, userId },
      take: pagination.perPage + 1,
      ...(pagination.cursor && { skip: 1, cursor: { id: pagination.cursor } }),
      orderBy: { [sortField]: sortOrder },
    });

    const hasMore = media.length > pagination.perPage;
    const items = hasMore ? media.slice(0, -1) : media;

    return {
      data: items,
      meta: {
        perPage: pagination.perPage,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    };
  }

  async getMedia(userId: string, mediaId: string) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Media not found');
    if (media.userId !== userId) throw new ForbiddenException();
    return media;
  }

  async updateMedia(userId: string, mediaId: string, dto: UpdateMediaDto) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Media not found');
    if (media.userId !== userId) throw new ForbiddenException();

    if (dto.locationId) {
      const location = await this.prisma.tripLocation.findUnique({ where: { id: dto.locationId } });
      if (!location || location.tripId !== media.tripId) {
        throw new BadRequestException('Location does not belong to this trip');
      }
    }

    return this.prisma.media.update({
      where: { id: mediaId },
      data: {
        ...(dto.caption !== undefined && { caption: dto.caption }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.locationName && { locationName: dto.locationName }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.locationId && { locationId: dto.locationId }),
      },
    });
  }

  async deleteMedia(userId: string, mediaId: string) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Media not found');
    if (media.userId !== userId) throw new ForbiddenException();

    await this.prisma.$transaction(async (tx) => {
      await tx.media.delete({ where: { id: mediaId } });

      if (media.type === 'IMAGE' || media.type === 'VIDEO') {
        await tx.trip.update({
          where: { id: media.tripId },
          data: media.type === 'VIDEO' ? { videosCount: { decrement: 1 } } : { photosCount: { decrement: 1 } },
        });
      }
    });
    // TODO: Trigger S3 deletion async
    return { deleted: true };
  }

  async processMedia(userId: string, mediaId: string) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Media not found');
    if (media.userId !== userId) throw new ForbiddenException();

    // TODO: Queue AI enhancement job
    return { queued: true, mediaId };
  }

  // Upload rights mirror trips.service#getEditableTrip: owner or non-VIEWER
  // collaborator.
  private async assertCanUploadToTrip(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId === userId) return;

    const collaborator = await this.prisma.tripCollaborator.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!collaborator || collaborator.role === 'VIEWER') {
      throw new ForbiddenException('You do not have permission to upload to this trip');
    }
  }
}
