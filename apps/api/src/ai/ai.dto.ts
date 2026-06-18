import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateStoryDto {
  @ApiProperty()
  @IsString()
  tripId: string;

  @ApiPropertyOptional({ enum: ['poetic', 'humorous', 'descriptive', 'journalistic', 'minimal'] })
  @IsOptional()
  @IsEnum(['poetic', 'humorous', 'descriptive', 'journalistic', 'minimal'])
  tone?: string = 'descriptive';

  @ApiPropertyOptional({ enum: ['short', 'medium', 'long'] })
  @IsOptional()
  @IsEnum(['short', 'medium', 'long'])
  length?: string = 'medium';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userPrompt?: string;
}

export class GenerateTitleDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  destinations: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dates?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  theme?: string;
}

export class EnhancePhotoDto {
  @ApiProperty()
  @IsString()
  mediaId: string;

  @ApiPropertyOptional({ enum: ['auto-correct', 'upscale', 'style-transfer', 'remove-object'] })
  @IsOptional()
  @IsEnum(['auto-correct', 'upscale', 'style-transfer', 'remove-object'])
  enhancementType?: string = 'auto-correct';
}
