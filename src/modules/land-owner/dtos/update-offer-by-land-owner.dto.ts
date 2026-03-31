import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateOfferByLandOwnerDto {
  @IsOptional()
  @IsMongoId()
  readonly landownerId?: string;

  @IsMongoId()
  @IsNotEmpty()
  readonly landownerProjectId: string;
}
