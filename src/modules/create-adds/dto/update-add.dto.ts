import { PartialType } from '@nestjs/mapped-types';
import { CreateAddDto } from './create-add.dto';

export class UpdateAddDto extends PartialType(CreateAddDto) {
  
}
