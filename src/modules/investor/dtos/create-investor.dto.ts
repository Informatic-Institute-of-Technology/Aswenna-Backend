import { IsNotEmpty, IsString } from 'class-validator';
import { UserCreateDto } from 'src/modules/user/dtos/user.create.dto';

export class InvestorCreateDto extends UserCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly organization: string;

  @IsNotEmpty()
  @IsString()
  readonly crop: string;

  @IsNotEmpty()
  @IsNotEmpty()
  readonly timeline: string;

  @IsNotEmpty()
  @IsString()
  readonly specificNeeds: string;
}
