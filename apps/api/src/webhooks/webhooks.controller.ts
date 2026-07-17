import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { Request } from 'express';
import { WebhooksService, ClerkWebhookEvent } from './webhooks.service';

// Intentionally unauthenticated: authenticity comes from the svix signature,
// not a bearer token. Requires rawBody (enabled in main.ts) — svix signs the
// exact bytes, so a re-serialized JSON body would never verify.
@ApiExcludeController()
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const secret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
    if (!secret) {
      // Configured-off deployments should fail loudly on Clerk's side (5xx →
      // Clerk retries) rather than silently ack events that were never applied.
      throw new ServiceUnavailableException('CLERK_WEBHOOK_SECRET is not configured');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    let event: ClerkWebhookEvent;
    try {
      event = new Webhook(secret).verify(req.rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      this.logger.warn(`Rejected Clerk webhook: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.webhooksService.handleClerkEvent(event);
    return { received: true };
  }
}
