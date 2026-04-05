import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

@Injectable()
export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;
  private accountKey: string;
  private accountName: string;
  private sharedKeyCredential: StorageSharedKeyCredential;
  private uploadSasExpirationMinutes: number;

  constructor(private configService: ConfigService) {
    this.initializeAzureClient();
  }

  private initializeAzureClient() {
    const accountName = this.configService.get<string>(
      'azure.storageAccountName',
    );
    const accountKey = this.configService.get<string>(
      'azure.storageAccountKey',
    );
    const containerName = this.configService.get<string>('azure.containerName');

    if (!accountName || !accountKey) {
      throw new InternalServerErrorException(
        'Azure Storage credentials are not configured',
      );
    }

    this.accountName = accountName;
    this.accountKey = accountKey;
    this.containerName = containerName || 'files';
    this.uploadSasExpirationMinutes =
      this.configService.get<number>('azure.uploadSasExpirationMinutes') ?? 15;
    this.sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );

    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  getBlobServiceClient(): BlobServiceClient {
    return this.blobServiceClient;
  }

  getContainerName(): string {
    return this.containerName;
  }

  getAccountName(): string {
    return this.accountName;
  }

  getAccountKey(): string {
    return this.accountKey;
  }

  getSharedKeyCredential(): StorageSharedKeyCredential {
    return this.sharedKeyCredential;
  }

  getUploadSasExpirationMinutes(): number {
    return this.uploadSasExpirationMinutes;
  }
}
