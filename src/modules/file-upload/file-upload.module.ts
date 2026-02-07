import { Module } from '@nestjs/common';
import { AzureConfigModule } from '../../config/azure/azure.module';
import { FileUploadController } from './file-upload.controller';

@Module({
  imports: [AzureConfigModule],
  controllers: [FileUploadController],
})
export class FileUploadModule {}
