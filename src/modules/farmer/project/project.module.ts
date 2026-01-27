import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import {
  FarmerProject,
  FarmerProjectSchema,
} from '../schemas/farmer-project.schema';
import { FarmerModule } from '../farmer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FarmerProject.name, schema: FarmerProjectSchema },
    ]),
    forwardRef(() => FarmerModule),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
