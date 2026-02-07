import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { AzureStorageService } from '../azure-storage.service';
import {
  FileUploadResponse,
  DeleteFileResponse,
  PreSignedUrlResponse,
} from '../types/azure-blob.types';

@Injectable()
export class AzureBlobStorageService {
  private readonly logger = new Logger(AzureBlobStorageService.name);

  constructor(private azureStorageService: AzureStorageService) {}

  async uploadFile(
    file: any,
    folderPath?: string,
  ): Promise<FileUploadResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const blobServiceClient = this.azureStorageService.getBlobServiceClient();
      const containerName = this.azureStorageService.getContainerName();
      const containerClient =
        blobServiceClient.getContainerClient(containerName);

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = folderPath
        ? `${folderPath}/${timestamp}-${file.originalname}`
        : `${timestamp}-${file.originalname}`;

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      this.logger.log(
        `Uploading file: ${fileName} to container: ${containerName}`,
      );

      // Upload the file
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });

      // Get the blob properties
      const properties = await blockBlobClient.getProperties();

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return {
        fileName: fileName,
        url: blockBlobClient.url,
        size: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date(properties.createdOn || Date.now()),
      };
    } catch (error) {
      this.logger.error(
        `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(fileName: string): Promise<DeleteFileResponse> {
    try {
      if (!fileName) {
        throw new BadRequestException('File name is required');
      }

      const blobServiceClient = this.azureStorageService.getBlobServiceClient();
      const containerName = this.azureStorageService.getContainerName();
      const containerClient =
        blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      this.logger.log(
        `Deleting file: ${fileName} from container: ${containerName}`,
      );

      // Check if blob exists before deleting
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new BadRequestException(`File not found: ${fileName}`);
      }

      await blockBlobClient.delete();

      this.logger.log(`File deleted successfully: ${fileName}`);

      return {
        success: true,
        message: `File ${fileName} deleted successfully`,
        fileName: fileName,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async generatePreSignedUrl(
    fileName: string,
    expiresInMinutes: number = 60,
  ): Promise<PreSignedUrlResponse> {
    try {
      if (!fileName) {
        throw new BadRequestException('File name is required');
      }

      const blobServiceClient = this.azureStorageService.getBlobServiceClient();
      const containerName = this.azureStorageService.getContainerName();
      const containerClient =
        blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      this.logger.log(
        `Generating pre-signed URL for: ${fileName} with expiration: ${expiresInMinutes} minutes`,
      );

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new BadRequestException(`File not found: ${fileName}`);
      }

      // Generate SAS URL
      const expiresOn = new Date(
        new Date().valueOf() + expiresInMinutes * 60 * 1000,
      );

      const permissions = new BlobSASPermissions();
      permissions.read = true;

      const sasQueryParameters = generateBlobSASQueryParameters(
        {
          containerName: containerName,
          blobName: fileName,
          permissions: permissions,
          expiresOn: expiresOn,
        } as any,
        this.azureStorageService.getAccountName() as any,
        this.azureStorageService.getAccountKey(),
      );

      const sasUrl = `${blockBlobClient.url}?${sasQueryParameters}`;

      this.logger.log(`Pre-signed URL generated successfully for: ${fileName}`);

      return {
        url: sasUrl,
        expiresIn: expiresInMinutes,
        fileName: fileName,
      };
    } catch (error) {
      this.logger.error(
        `Error generating pre-signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to generate pre-signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    try {
      if (!fileName) {
        throw new BadRequestException('File name is required');
      }

      const blobServiceClient = this.azureStorageService.getBlobServiceClient();
      const containerName = this.azureStorageService.getContainerName();
      const containerClient =
        blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      this.logger.log(`Retrieving URL for file: ${fileName}`);

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new BadRequestException(`File not found: ${fileName}`);
      }

      this.logger.log(`URL retrieved successfully for: ${fileName}`);

      return blockBlobClient.url;
    } catch (error) {
      this.logger.error(
        `Error getting file URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
