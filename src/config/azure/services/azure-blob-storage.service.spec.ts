import { StorageSharedKeyCredential } from '@azure/storage-blob';
import { AzureStorageService } from '../azure-storage.service';
import { AzureBlobStorageService } from './azure-blob-storage.service';

describe('AzureBlobStorageService', () => {
  it('generates upload SAS URLs with create and write permissions', async () => {
    const blockBlobClient = {
      url: 'https://example.blob.core.windows.net/files/farmers/u1/profilePicture/file.png',
    };
    const azureStorageService = {
      getBlobServiceClient: jest.fn().mockReturnValue({
        getContainerClient: jest.fn().mockReturnValue({
          getBlockBlobClient: jest.fn().mockReturnValue(blockBlobClient),
        }),
      }),
      getContainerName: jest.fn().mockReturnValue('files'),
      getSharedKeyCredential: jest
        .fn()
        .mockReturnValue(
          new StorageSharedKeyCredential(
            'example',
            Buffer.from('test-key').toString('base64'),
          ),
        ),
      getUploadSasExpirationMinutes: jest.fn().mockReturnValue(15),
    } as unknown as AzureStorageService;

    const service = new AzureBlobStorageService(azureStorageService);

    const result = await service.generateUploadUrl(
      'farmers/u1/profilePicture/file.png',
      'image/png',
    );

    const params = new URL(result.url).searchParams;

    expect(result.method).toBe('PUT');
    expect(result.headers).toEqual({
      'Content-Type': 'image/png',
      'x-ms-blob-type': 'BlockBlob',
    });
    expect(params.get('sp')).toContain('c');
    expect(params.get('sp')).toContain('w');
  });
});
