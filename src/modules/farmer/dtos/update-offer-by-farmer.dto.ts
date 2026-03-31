import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateOfferByFarmerDto {
  @IsOptional()
  @IsMongoId()
  readonly farmerId?: string;

  @IsMongoId()
  @IsNotEmpty()
  readonly farmerProjectId: string;
}
