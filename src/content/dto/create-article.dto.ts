import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty() @IsString() @MinLength(1) title: string;
  @ApiProperty() @IsString() @MinLength(1) slug: string;
  @ApiProperty() @IsString() @MinLength(1) excerpt: string;
  @ApiProperty() @IsString() @MinLength(1) content: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() published?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() publishedAt?: string;
}
