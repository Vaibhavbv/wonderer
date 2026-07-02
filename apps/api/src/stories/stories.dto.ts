import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ description: 'Arbitrary story theme JSON' })
  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @ApiProperty({ description: 'Ordered array of story blocks (full replace)' })
  @IsArray()
  blocks: unknown[];
}
