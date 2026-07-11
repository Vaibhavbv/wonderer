import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '@prisma/prisma.service';

const uniqueConstraintError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.2.1',
  });

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: Record<string, jest.Mock>;
    trip: Record<string, jest.Mock>;
    media: Record<string, jest.Mock>;
    follow: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      trip: {
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      media: {
        count: jest.fn(),
      },
      follow: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  describe('updateProfile', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('user-1', { bio: 'hi' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when the username is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockRejectedValue(uniqueConstraintError());

      await expect(service.updateProfile('user-1', { username: 'taken' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('does not mask non-conflict DB errors as ConflictException', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockRejectedValue(new Error('connection lost'));

      await expect(service.updateProfile('user-1', { username: 'x' })).rejects.toThrow(
        'connection lost',
      );
    });

    it('only writes the fields provided in the dto', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockResolvedValue({ id: 'user-1', bio: 'new bio' });

      await service.updateProfile('user-1', { bio: 'new bio' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { bio: 'new bio' },
      });
    });
  });

  describe('getProfile', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
