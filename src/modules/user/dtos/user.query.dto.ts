import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UserParamsDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly user: string;
}



