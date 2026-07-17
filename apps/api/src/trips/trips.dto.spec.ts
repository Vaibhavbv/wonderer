import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { TripListQueryDto } from './trips.dto';

// Regression guard: the global pipe runs with forbidNonWhitelisted, so every
// query key the frontend sends must be declared on the DTO. The dashboard
// always calls /v1/trips?per_page=50&sort=created_at:desc — if those keys
// ever fall off the whitelist again, the whole trip list 400s.
describe('TripListQueryDto under the global ValidationPipe settings', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });

  const metadata = { type: 'query' as const, metatype: TripListQueryDto };

  it('accepts the exact query string the frontend dashboard sends', async () => {
    await expect(
      pipe.transform({ per_page: '50', sort: 'created_at:desc' }, metadata),
    ).resolves.toBeDefined();
  });

  it('accepts pagination params combined with filters', async () => {
    await expect(
      pipe.transform(
        { per_page: '20', sort: 'start_date:asc', cursor: 'trip_abc', status: 'PUBLISHED', search: 'japan' },
        metadata,
      ),
    ).resolves.toBeDefined();
  });

  it('still rejects unknown query keys', async () => {
    await expect(pipe.transform({ nope: '1' }, metadata)).rejects.toThrow(BadRequestException);
  });

  it('rejects a non-numeric per_page', async () => {
    await expect(pipe.transform({ per_page: 'abc' }, metadata)).rejects.toThrow(BadRequestException);
  });
});
