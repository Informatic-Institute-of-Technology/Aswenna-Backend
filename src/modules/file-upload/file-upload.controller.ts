import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Query,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AzureBlobStorageService } from '../../config/azure/services/azure-blob-storage.service';
import {
  PreSignedUrlDto,
  DeleteFileDto,
} from '../../config/azure/dtos/azure-blob.dto';
import {
  FileUploadResponse,
  DeleteFileResponse,
  PreSignedUrlResponse,
} from '../../config/azure/types/azure-blob.types';
import { LEGACY_UPLOAD_MULTER_OPTIONS } from 'src/common/constants/upload.constants';
import { UploadLimitExceptionFilter } from 'src/common/filters/upload-limit-exception.filter';

@Controller({ path: 'file-upload', version: '1' })
@UseFilters(UploadLimitExceptionFilter)
export class FileUploadController {
  constructor(
    private readonly azureBlobStorageService: AzureBlobStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', LEGACY_UPLOAD_MULTER_OPTIONS))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: any,
    @Query('folderPath') folderPath?: string,
  ): Promise<FileUploadResponse> {
    return this.azureBlobStorageService.uploadFile(file, folderPath);
  }

  @Post('pre-signed-url')
  @HttpCode(HttpStatus.OK)
  async generatePreSignedUrl(
    @Body() dto: PreSignedUrlDto,
  ): Promise<PreSignedUrlResponse> {
    return this.azureBlobStorageService.generatePreSignedUrl(
      dto.fileName,
      dto.expiresInMinutes,
    );
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Body() dto: DeleteFileDto): Promise<DeleteFileResponse> {
    return this.azureBlobStorageService.deleteFile(dto.fileName);
  }

  @Post('get-url')
  @HttpCode(HttpStatus.OK)
  async getFileUrl(@Body() dto: DeleteFileDto): Promise<{ url: string }> {
    const url = await this.azureBlobStorageService.getFileUrl(dto.fileName);
    return { url };
  }
}
