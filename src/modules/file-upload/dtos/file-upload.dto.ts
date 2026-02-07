import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PreSignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsOptional()
  @IsNotEmpty()
  expiresInMinutes?: number = 60;
}

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;
}

export class GetFileUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;
}
