import { PartialType } from '@nestjs/mapped-types';
import { UserCreateDto } from './user.create.dto';

export class UpdateUserDto extends PartialType(UserCreateDto) {}
