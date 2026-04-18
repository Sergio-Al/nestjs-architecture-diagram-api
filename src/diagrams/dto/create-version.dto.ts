import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;
}
