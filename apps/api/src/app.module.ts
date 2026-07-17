import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { MediaModule } from './media/media.module';
import { StoriesModule } from './stories/stories.module';
import { AiModule } from './ai/ai.module';
import { MapsModule } from './maps/maps.module';
import { SocialModule } from './social/social.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ExportsModule } from './exports/exports.module';
import { CommentsModule } from './comments/comments.module';

import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          { name: 'short', ttl: 60000, limit: 100 },
          { name: 'long', ttl: 3600000, limit: 1000 },
        ],
        // With REDIS_HOST configured, limits are shared across instances;
        // without it (single-instance/free-tier), the in-memory default is
        // both sufficient and dependency-free.
        ...(config.get<string>('REDIS_HOST') && {
          storage: new RedisThrottlerStorage(
            config.get<string>('REDIS_HOST', 'localhost'),
            parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
            config.get<string>('REDIS_PASSWORD') || undefined,
          ),
        }),
      }),
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    TripsModule,
    MediaModule,
    StoriesModule,
    AiModule,
    MapsModule,
    SocialModule,
    PaymentsModule,
    WebhooksModule,
    NotificationsModule,
    AnalyticsModule,
    ExportsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enforces the named 'short'/'long' limits registered above on every
    // route; previously only configured, never actually applied (WV-901).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
