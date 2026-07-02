import { plainToInstance, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

// Flat shape matching the actual environment variables the app reads via
// ConfigService.get(...) (see .env.example). Required fields have no
// @IsOptional() and will fail startup if missing/blank; everything else keeps
// the runtime defaults already applied at each call site.
export class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  CLERK_SECRET_KEY: string;

  @IsString()
  CLERK_PUBLISHABLE_KEY: string;

  @IsString()
  @IsOptional()
  CLERK_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  REDIS_DB?: number;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_PUBLISHABLE_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_REGION?: string;

  @IsString()
  @IsOptional()
  S3_BUCKET_NAME?: string;

  @IsString()
  @IsOptional()
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY?: string;

  @IsString()
  @IsOptional()
  MAPBOX_ACCESS_TOKEN?: string;

  @IsString()
  @IsOptional()
  NODE_ENV?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  PORT?: number;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;
}

/**
 * Passed to ConfigModule.forRoot({ validate }). Runs on boot, before any
 * module wires up — a missing/invalid required var throws here instead of
 * surfacing later as a confusing runtime failure (e.g. Prisma connect,
 * Clerk token verification).
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validatedConfig;
}
