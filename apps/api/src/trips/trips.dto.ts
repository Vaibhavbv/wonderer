import { IsString, IsOptional, IsArray, IsEnum, IsDateString, IsObject, ValidateNested, ArrayMinSize, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsString()
  latitude: number;

  @ApiProperty()
  @IsString()
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;
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
}
