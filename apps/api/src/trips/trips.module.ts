import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { PrismaModule } from '@prisma/prisma.module';
import { RedisModule } from '@redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
