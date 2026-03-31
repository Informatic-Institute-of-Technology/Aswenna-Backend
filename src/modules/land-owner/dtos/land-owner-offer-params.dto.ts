import { IsMongoId, IsNotEmpty } from 'class-validator';

export class LandOwnerOfferParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly offer: string;
}
