import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '@prisma/prisma.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: { user: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      user: { upsert: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhooksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(WebhooksService);
  });

  it('upserts on user.created with primary email, name, and avatar', async () => {
    await service.handleClerkEvent({
      type: 'user.created',
      data: {
        id: 'clerk_1',
        primary_email_address_id: 'em_2',
        email_addresses: [
          { id: 'em_1', email_address: 'old@example.com' },
          { id: 'em_2', email_address: 'primary@example.com' },
        ],
        first_name: 'Ada',
        last_name: 'Lovelace',
        image_url: 'https://img.clerk.com/ada.png',
      },
    });

    const args = prisma.user.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ clerkId: 'clerk_1' });
    expect(args.update.email).toBe('primary@example.com');
    expect(args.update.displayName).toBe('Ada Lovelace');
    expect(args.update.avatarUrl).toBe('https://img.clerk.com/ada.png');
  });

  it('falls back to a placeholder-email upsert when the email collides', async () => {
    prisma.user.upsert
      .mockRejectedValueOnce(new Error('P2002 email'))
      .mockResolvedValueOnce({});

    await service.handleClerkEvent({
      type: 'user.updated',
      data: {
        id: 'clerk_1',
        email_addresses: [{ id: 'em_1', email_address: 'taken@example.com' }],
      },
    });

    expect(prisma.user.upsert).toHaveBeenCalledTimes(2);
    const retry = prisma.user.upsert.mock.calls[1][0];
    expect(retry.update.email).toBeUndefined();
  });

  it('deletes the DB user on user.deleted and tolerates unknown users', async () => {
    await service.handleClerkEvent({ type: 'user.deleted', data: { id: 'clerk_1' } });
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({ where: { clerkId: 'clerk_1' } });

    prisma.user.deleteMany.mockResolvedValue({ count: 0 });
    await expect(
      service.handleClerkEvent({ type: 'user.deleted', data: { id: 'clerk_unknown' } }),
    ).resolves.toBeUndefined();
  });

  it('ignores unrelated event types', async () => {
    await service.handleClerkEvent({ type: 'session.created', data: { id: 'x' } });
    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });
});
