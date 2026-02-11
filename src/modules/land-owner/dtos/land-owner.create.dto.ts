import { IsNotEmpty, IsString } from 'class-validator';
import { UserCreateDto } from 'src/modules/user/dtos/user.create.dto';

export class LandOwnerCreateDto extends UserCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly location: string;

  @IsNotEmpty()
  @IsString()
  readonly size: string;

  @IsNotEmpty()
  @IsString()
  readonly sail: string;

  @IsNotEmpty()
  @IsString()
  readonly expectation: string;
}
