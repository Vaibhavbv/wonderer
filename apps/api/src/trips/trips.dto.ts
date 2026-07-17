import { IsString, IsOptional, IsArray, IsEnum, IsDateString, IsNumberString, IsObject, IsNumber, ValidateNested, ArrayMinSize, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'The traveler\'s memory/story for this stop' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateTripDto {
  @ApiProperty({ description: 'Trip title', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Trip description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'UNLISTED', 'PUBLIC'] })
  @IsOptional()
  @IsEnum(['PRIVATE', 'UNLISTED', 'PUBLIC'])
  privacy?: string = 'PRIVATE';

  @ApiPropertyOptional({ type: [LocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations?: LocationDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  theme?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverPhotoId?: string;
}

export class UpdateTripDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'UNLISTED', 'PUBLIC'] })
  @IsOptional()
  @IsEnum(['PRIVATE', 'UNLISTED', 'PUBLIC'])
  privacy?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  theme?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverPhotoId?: string;
}

// Post-create location management. Unlike the nested create-time LocationDto,
// coordinates are required here: the whole point of editing a stop after the
// fact is placing its pin correctly on the journey globe.
export class CreateLocationDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'The traveler\'s memory/story for this stop' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReorderLocationsDto {
  @ApiProperty({ type: [String], description: 'Every location id of the trip, in the desired order' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  locationIds: string[];
}

export class TripListQueryDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'UNLISTED', 'PUBLIC'] })
  @IsOptional()
  @IsEnum(['PRIVATE', 'UNLISTED', 'PUBLIC'])
  privacy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  // Pagination params are consumed by the @Pagination() decorator, but they
  // must be declared here anyway: the global ValidationPipe runs with
  // forbidNonWhitelisted, so any query key missing from this DTO 400s the
  // whole request.
  @ApiPropertyOptional({ description: 'Items per page (1-100)' })
  @IsOptional()
  @IsNumberString()
  per_page?: string;

  @ApiPropertyOptional({ description: 'Sort key, e.g. created_at:desc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Cursor (id of the last item of the previous page)' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
