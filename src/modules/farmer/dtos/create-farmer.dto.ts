import { IsNotEmpty, IsString } from 'class-validator';
import { UserCreateDto } from 'src/modules/user/dtos/user.create.dto';

export class FarmerCreateDto extends UserCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly experience: string;

  @IsNotEmpty()
  @IsString()
  readonly crop: string;

  @IsNotEmpty()
  @IsString()
  readonly regions: string;

  @IsNotEmpty()
  @IsString()
  readonly specificNeeds: string;
}
