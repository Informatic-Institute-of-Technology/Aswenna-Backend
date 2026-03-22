import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadController } from './file-upload.controller';
import { AzureBlobStorageService } from '../../config/azure/services/azure-blob-storage.service';

describe('FileUploadController', () => {
  let controller: FileUploadController;
  let azureBlobStorageService: {
    uploadFile: jest.Mock;
    generatePreSignedUrl: jest.Mock;
    deleteFile: jest.Mock;
    getFileUrl: jest.Mock;
  };

  beforeEach(async () => {
    azureBlobStorageService = {
      uploadFile: jest.fn(),
      generatePreSignedUrl: jest.fn(),
      deleteFile: jest.fn(),
      getFileUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUploadController],
      providers: [
        { provide: AzureBlobStorageService, useValue: azureBlobStorageService },
      ],
    }).compile();

    controller = module.get<FileUploadController>(FileUploadController);
  });

  it('uploadFile delegates to azure service with folderPath', async () => {
    const file = {
      originalname: 'profile.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('test'),
    };

    const response = {
      fileName: 'uploads/profile.png',
      url: 'https://storage.test/uploads/profile.png',
      size: 1024,
      contentType: 'image/png',
      uploadedAt: new Date(),
    };

    azureBlobStorageService.uploadFile.mockResolvedValue(response);

    const result = await controller.uploadFile(file, 'uploads');

    expect(azureBlobStorageService.uploadFile).toHaveBeenCalledWith(
      file,
      'uploads',
    );
    expect(result).toEqual(response);
  });

  it('generatePreSignedUrl delegates to azure service', async () => {
    const dto = {
      fileName: 'invoice.pdf',
      expiresInMinutes: 30,
    };

    const response = {
      url: 'https://storage.test/pre-signed-url',
      expiresIn: 30,
      fileName: 'invoice.pdf',
    };

    azureBlobStorageService.generatePreSignedUrl.mockResolvedValue(response);

    const result = await controller.generatePreSignedUrl(dto as any);

    expect(azureBlobStorageService.generatePreSignedUrl).toHaveBeenCalledWith(
      dto.fileName,
      dto.expiresInMinutes,
    );
    expect(result).toEqual(response);
  });

  it('deleteFile delegates to azure service', async () => {
    const dto = { fileName: 'uploads/profile.png' };
    const response = {
      success: true,
      message: 'File deleted successfully',
      fileName: dto.fileName,
    };

    azureBlobStorageService.deleteFile.mockResolvedValue(response);

    const result = await controller.deleteFile(dto as any);

    expect(azureBlobStorageService.deleteFile).toHaveBeenCalledWith(
      dto.fileName,
    );
    expect(result).toEqual(response);
  });

  it('getFileUrl returns wrapped url object from azure service', async () => {
    const dto = { fileName: 'uploads/profile.png' };
    const url = 'https://storage.test/uploads/profile.png';

    azureBlobStorageService.getFileUrl.mockResolvedValue(url);

    const result = await controller.getFileUrl(dto as any);

    expect(azureBlobStorageService.getFileUrl).toHaveBeenCalledWith(
      dto.fileName,
    );
    expect(result).toEqual({ url });
  });
});
