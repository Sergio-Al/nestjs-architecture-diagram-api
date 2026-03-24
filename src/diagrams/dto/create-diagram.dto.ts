import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';

export class CreateDiagramDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
