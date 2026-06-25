import { Module } from '@nestjs/common';
import { SocialController, FeedController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  controllers: [SocialController, FeedController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
