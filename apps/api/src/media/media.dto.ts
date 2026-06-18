import { IsString, IsOptional, IsNumber, IsArray, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignedUrlDto {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  contentType: string;

  @ApiProperty()
  @IsNumber()
  fileSize: number;

  @ApiProperty()
  @IsString()
  tripId: string;
}

export class UpdateMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
