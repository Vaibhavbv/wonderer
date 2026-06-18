import { IsString, IsNumber, IsOptional, ValidateNested, IsBoolean, IsEnum, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class DatabaseConfig {
  @IsString()
  DATABASE_URL: string;
}

export class RedisConfig {
  @IsString()
  @IsOptional()
  REDIS_HOST?: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  REDIS_PORT?: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  REDIS_DB?: number = 0;
}

export class ClerkConfig {
  @IsString()
  CLERK_SECRET_KEY: string;

  @IsString()
  CLERK_PUBLISHABLE_KEY: string;

  @IsString()
  @IsOptional()
  CLERK_WEBHOOK_SECRET?: string;
}

export class StripeConfig {
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_PUBLISHABLE_KEY?: string;
}

export class AWSConfig {
  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_REGION?: string = 'us-east-1';

  @IsString()
  @IsOptional()
  S3_BUCKET_NAME?: string;
}

export class OpenAIConfig {
  @IsString()
  @IsOptional()
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY?: string;
}

export class MapboxConfig {
  @IsString()
  @IsOptional()
  MAPBOX_ACCESS_TOKEN?: string;
}

export class AppConfig {
  @IsString()
  @IsOptional()
  NODE_ENV?: string = 'development';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  PORT?: number = 3001;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string = '*';

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string = 'http://localhost:3000';
}

export class EnvConfig {
  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  redis: RedisConfig;

  @ValidateNested()
  @Type(() => ClerkConfig)
  clerk: ClerkConfig;

  @ValidateNested()
  @Type(() => StripeConfig)
  stripe: StripeConfig;

  @ValidateNested()
  @Type(() => AWSConfig)
  aws: AWSConfig;

  @ValidateNested()
  @Type(() => OpenAIConfig)
  openai: OpenAIConfig;

  @ValidateNested()
  @Type(() => MapboxConfig)
  mapbox: MapboxConfig;

  @ValidateNested()
  @Type(() => AppConfig)
  app: AppConfig;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = {
    ...config,
    PORT: config['PORT'] ? parseInt(config['PORT'] as string, 10) : 3001,
    REDIS_PORT: config['REDIS_PORT'] ? parseInt(config['REDIS_PORT'] as string, 10) : 6379,
    REDIS_DB: config['REDIS_DB'] ? parseInt(config['REDIS_DB'] as string, 10) : 0,
  };
  return validatedConfig;
}
