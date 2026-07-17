import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

export interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Mirrors Clerk-side user lifecycle into the DB. The auth guard's upsert
  // only provisions on first request and never refreshes, so without these
  // events profile email/name/avatar changes and deletions never land here.
  async handleClerkEvent(event: ClerkWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await this.upsertUser(event.data);
        break;
      case 'user.deleted':
        await this.deleteUser(event.data.id);
        break;
      default:
        this.logger.debug(`Ignoring Clerk event type ${event.type}`);
    }
  }

  private async upsertUser(data: ClerkUserData): Promise<void> {
    const primaryEmail =
      data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
      data.email_addresses?.[0]?.email_address;
    const displayName =
      [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || undefined;

    const fields = {
      ...(primaryEmail && { email: primaryEmail }),
      ...(displayName && { displayName }),
      ...(data.image_url && { avatarUrl: data.image_url }),
    };

    try {
      await this.prisma.user.upsert({
        where: { clerkId: data.id },
        update: fields,
        create: {
          clerkId: data.id,
          email: primaryEmail ?? `${data.id}@placeholder.wanderverse.app`,
          ...(displayName && { displayName }),
          ...(data.image_url && { avatarUrl: data.image_url }),
        },
      });
      this.logger.log(`Synced Clerk user ${data.id}`);
    } catch (err) {
      // An email collision (another row already owns this address) must not
      // fail the whole webhook — sync what we can without the email.
      this.logger.warn(`Clerk user sync for ${data.id} degraded: ${err.message}`);
      await this.prisma.user.upsert({
        where: { clerkId: data.id },
        update: {
          ...(displayName && { displayName }),
          ...(data.image_url && { avatarUrl: data.image_url }),
        },
        create: {
          clerkId: data.id,
          email: `${data.id}@placeholder.wanderverse.app`,
          ...(displayName && { displayName }),
          ...(data.image_url && { avatarUrl: data.image_url }),
        },
      });
    }
  }

  private async deleteUser(clerkId: string): Promise<void> {
    // deleteMany instead of delete: user.deleted may arrive for a user that
    // never hit the API (no row) — that's a no-op, not an error.
    const result = await this.prisma.user.deleteMany({ where: { clerkId } });
    this.logger.log(
      result.count > 0
        ? `Deleted user ${clerkId} (Clerk user.deleted)`
        : `Clerk user.deleted for unknown user ${clerkId} — nothing to do`,
    );
  }
}
