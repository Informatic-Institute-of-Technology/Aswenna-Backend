import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  BlobSASPermissions,
  BlockBlobClient,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AzureStorageService } from '../azure-storage.service';
import {
  BlobFileDetails,
  FileUploadResponse,
  DeleteFileResponse,
  PreSignedUrlResponse,
  UploadUrlResponse,
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

      const containerName = this.azureStorageService.getContainerName();
      const fileName = this.createBlobFileName(file.originalname, folderPath);
      const blockBlobClient = this.getBlockBlobClient(fileName);

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

  createBlobFileName(originalName: string, folderPath?: string): string {
    const timestamp = Date.now();
    const safeOriginalName = this.sanitizeFileName(originalName);
    const uniqueSegment = randomUUID();
    const fileName = `${timestamp}-${uniqueSegment}-${safeOriginalName}`;

    return folderPath ? `${folderPath}/${fileName}` : fileName;
  }

  async deleteFile(fileName: string): Promise<DeleteFileResponse> {
    try {
      if (!fileName) {
        throw new BadRequestException('File name is required');
      }

      const containerName = this.azureStorageService.getContainerName();
      const blockBlobClient = this.getBlockBlobClient(fileName);

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

      const containerName = this.azureStorageService.getContainerName();
      const blockBlobClient = this.getBlockBlobClient(fileName);

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
        },
        this.azureStorageService.getSharedKeyCredential(),
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

  async generateUploadUrl(
    fileName: string,
    contentType: string,
    expiresInMinutes: number = this.azureStorageService.getUploadSasExpirationMinutes(),
  ): Promise<UploadUrlResponse> {
    try {
      if (!fileName) {
        throw new BadRequestException('File name is required');
      }

      if (!contentType) {
        throw new BadRequestException('Content type is required');
      }

      const containerName = this.azureStorageService.getContainerName();
      const blockBlobClient = this.getBlockBlobClient(fileName);
      const expiresOn = new Date(
        new Date().valueOf() + expiresInMinutes * 60 * 1000,
      );

      const permissions = new BlobSASPermissions();
      permissions.create = true;
      permissions.write = true;

      const sasQueryParameters = generateBlobSASQueryParameters(
        {
          containerName,
          blobName: fileName,
          permissions,
          expiresOn,
          contentType,
        },
        this.azureStorageService.getSharedKeyCredential(),
      );

      this.logger.log(
        `Generated upload URL for: ${fileName} with expiration: ${expiresInMinutes} minutes`,
      );

      return {
        fileName,
        url: `${blockBlobClient.url}?${sasQueryParameters}`,
        expiresIn: expiresInMinutes,
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'x-ms-blob-type': 'BlockBlob',
        },
      };
    } catch (error) {
      this.logger.error(
        `Error generating upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getFileDetails(fileName: string): Promise<BlobFileDetails> {
    try {
      if (!fileName) {
        throw new BadRequestException('File name is required');
      }

      const blockBlobClient = this.getBlockBlobClient(fileName);
      const exists = await blockBlobClient.exists();

      if (!exists) {
        throw new BadRequestException(`File not found: ${fileName}`);
      }

      const properties = await blockBlobClient.getProperties();

      return {
        fileName,
        url: blockBlobClient.url,
        size: properties.contentLength ?? 0,
        contentType: properties.contentType ?? 'application/octet-stream',
        uploadedAt: new Date(
          properties.createdOn ??
            properties.lastModified ??
            properties.date ??
            Date.now(),
        ),
      };
    } catch (error) {
      this.logger.error(
        `Error getting file details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get file details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    try {
      if (!fileName) {
        throw new BadRequestException('File name is required');
      }

      const blockBlobClient = this.getBlockBlobClient(fileName);

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

  private getBlockBlobClient(fileName: string): BlockBlobClient {
    const blobServiceClient = this.azureStorageService.getBlobServiceClient();
    const containerName = this.azureStorageService.getContainerName();
    const containerClient = blobServiceClient.getContainerClient(containerName);

    return containerClient.getBlockBlobClient(fileName);
  }

  private sanitizeFileName(originalName: string): string {
    const fileName = basename(originalName || 'file');
    const sanitized = fileName
      .replace(/[^A-Za-z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '');

    return sanitized || 'file';
  }
}
