import { IsMongoId, IsNotEmpty } from 'class-validator';

export class FarmerOfferParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly offer: string;
}
