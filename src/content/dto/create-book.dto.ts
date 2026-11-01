import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateBookDto {
  @ApiProperty() @IsString() @MinLength(1) title: string;
  @ApiProperty() @IsString() @MinLength(1) slug: string;
  @ApiProperty() @IsString() @MinLength(1) description: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() purchaseUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() publishedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() visible?: boolean;
}
