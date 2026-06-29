import { Module } from '@nestjs/common';
import { SocialController, FeedController } from './social.controller';
import { SocialService } from './social.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SocialController, FeedController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
