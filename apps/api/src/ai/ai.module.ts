import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'ai-generation',
    }),
  ],
  controllers: [AiController],
  providers: [AiService, AiProcessor],
  exports: [AiService],
})
export class AiModule {}
