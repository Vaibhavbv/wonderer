import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health returns a healthy envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('GET /v1/notifications without a token is rejected', async () => {
    const res = await request(app.getHttpServer()).get('/v1/notifications');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBeDefined();
  });

  it('POST /v1/trips/:tripId/comments without a token is rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/trips/some-trip-id/comments')
      .send({ content: 'hello' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /v1/trips/:tripId/like with a malformed token is rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/trips/some-trip-id/like')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
