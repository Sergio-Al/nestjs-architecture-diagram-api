import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a valid hex color (e.g. #ff0000)' })
  color?: string;
}
