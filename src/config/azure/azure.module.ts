import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AzureStorageService } from './azure-storage.service';
import { AzureBlobStorageService } from './services/azure-blob-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [AzureStorageService, AzureBlobStorageService],
  exports: [AzureStorageService, AzureBlobStorageService],
})
export class AzureConfigModule {}
