import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProjectType } from '../project.types';

export class ProjectQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ProjectType)
  readonly projectType?: ProjectType;
}

export class ProjectParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly project: string;
}
