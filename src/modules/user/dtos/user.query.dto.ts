import { IsEmail, IsMongoId, IsNotEmpty } from 'class-validator';

export class UserParamsDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly user: string;
}

export class UserEmailParamsDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}
