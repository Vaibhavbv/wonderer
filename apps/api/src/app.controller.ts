import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '@prisma/prisma.service';

@ApiTags('Health')
@Controller()
@SkipThrottle() // infra health/readiness probes must never be rate-limited
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // Liveness: is the process up and serving HTTP. Deliberately dependency-free
  // so a slow DB doesn't get the container restarted.
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe (process only, no dependencies)' })
  health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'wanderverse-api',
      version: '1.0.0',
    };
  }

  // Readiness: can this instance actually serve requests. A hung DB must flip
  // this to 503 so the orchestrator stops routing traffic here.
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (checks database connectivity)' })
  async ready() {
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB ping timeout')), 2000)),
      ]);
    } catch (err) {
      throw new ServiceUnavailableException({ status: 'not ready', database: 'down', reason: err.message });
    }
    return { status: 'ready', database: 'up' };
  }
}
