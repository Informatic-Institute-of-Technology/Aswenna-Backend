import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import {
  FarmerProject,
  FarmerProjectSchema,
} from '../schemas/farmer-project.schema';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FarmerProject.name, schema: FarmerProjectSchema },
    ]),
    forwardRef(() => UserModule),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
