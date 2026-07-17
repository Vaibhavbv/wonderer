import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { PrismaModule } from '@prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
