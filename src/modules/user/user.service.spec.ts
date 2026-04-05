import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserImageTarget } from './schemas/user.schema';

describe('UserService upload flow', () => {
  const userId = '507f1f77bcf86cd799439011';

  const createExec = <T>(value: T) => ({
    exec: jest.fn().mockResolvedValue(value),
  });

  const mockFindById = (user: any) => ({
    populate: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue(createExec(user)),
    }),
  });

  const createService = (overrides?: {
    user?: any;
    farmer?: any;
    landOwner?: any;
  }) => {
    const user =
      overrides?.user ?? {
        _id: { toString: () => userId },
        role: { name: 'farmer', _id: { toString: () => 'role-1' } },
        personalInfo: {},
      };

    const userModel = {
      findById: jest.fn().mockReturnValue(mockFindById(user)),
      findByIdAndUpdate: jest.fn().mockReturnValue(createExec(user)),
      deleteOne: jest.fn().mockReturnValue(createExec({ deletedCount: 1 })),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };
    const roleService = {
      findByName: jest.fn(),
      findById: jest.fn(),
    };
    const farmerService = {
      create: jest.fn(),
      updateById: jest.fn().mockResolvedValue(overrides?.farmer ?? {}),
      findByUserId: jest
        .fn()
        .mockResolvedValue(
          overrides?.farmer ?? {
            _id: { toString: () => 'farmer-1' },
          },
        ),
    };
    const investorService = {
      create: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue(null),
    };
    const landOwnerService = {
      create: jest.fn(),
      updateById: jest.fn().mockResolvedValue(overrides?.landOwner ?? {}),
      findByUserId: jest
        .fn()
        .mockResolvedValue(
          overrides?.landOwner ?? {
            _id: { toString: () => 'landowner-1' },
            landAddress: {
              landImages: [],
            },
          },
        ),
    };
    const azureBlobStorageService = {
      createBlobFileName: jest.fn(),
      generateUploadUrl: jest.fn(),
      getFileDetails: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue({ success: true }),
      getFileUrl: jest.fn(),
      uploadFile: jest.fn(),
    };

    const service = new UserService(
      userModel as any,
      roleService as any,
      farmerService as any,
      investorService as any,
      landOwnerService as any,
      azureBlobStorageService as any,
    );

    return {
      service,
      mocks: {
        userModel,
        roleService,
        farmerService,
        investorService,
        landOwnerService,
        azureBlobStorageService,
      },
    };
  };

  it('creates upload requests with the resolved land-owner folder path', async () => {
    const { service, mocks } = createService({
      user: {
        _id: { toString: () => userId },
        role: { name: 'landowner', _id: { toString: () => 'role-1' } },
        personalInfo: {},
      },
      landOwner: {
        _id: { toString: () => 'landowner-1' },
        landAddress: {
          landImages: [],
        },
      },
    });
    mocks.azureBlobStorageService.createBlobFileName.mockReturnValue(
      'landowners/landowner-1/landImages/generated-photo.png',
    );
    mocks.azureBlobStorageService.generateUploadUrl.mockResolvedValue({
      url: 'https://upload.example',
      expiresIn: 15,
      fileName: 'landowners/landowner-1/landImages/generated-photo.png',
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png',
        'x-ms-blob-type': 'BlockBlob',
      },
    });

    const response = await service.createUploadRequests(userId, {
      files: [
        {
          target: UserImageTarget.LAND_IMAGES,
          originalName: 'photo.png',
          contentType: 'image/png',
          size: 1024,
        },
      ],
    });

    expect(mocks.azureBlobStorageService.createBlobFileName).toHaveBeenCalledWith(
      'photo.png',
      'landowners/landowner-1/landImages',
    );
    expect(response).toEqual({
      files: [
        {
          target: UserImageTarget.LAND_IMAGES,
          fileName: 'landowners/landowner-1/landImages/generated-photo.png',
          uploadUrl: 'https://upload.example',
          method: 'PUT',
          headers: {
            'Content-Type': 'image/png',
            'x-ms-blob-type': 'BlockBlob',
          },
        },
      ],
    });
  });

  it('rejects farmer-only targets for non-farmer users', async () => {
    const { service } = createService({
      user: {
        _id: { toString: () => userId },
        role: { name: 'investor', _id: { toString: () => 'role-1' } },
        personalInfo: {},
      },
    });

    await expect(
      service.createUploadRequests(userId, {
        files: [
          {
            target: UserImageTarget.GOVIJANA_SEVA_PASSBOOK,
            originalName: 'passbook.png',
            contentType: 'image/png',
            size: 256,
          },
        ],
      }),
    ).rejects.toThrow(
      'Target GovijanaSevaPassbookImage can only be used by farmer users',
    );
  });

  it('replaces a single-file target and deletes the previous blob after verification', async () => {
    const { service, mocks } = createService({
      user: {
        _id: { toString: () => userId },
        role: { name: 'farmer', _id: { toString: () => 'role-1' } },
        personalInfo: {
          profilePicture: {
            filename: 'farmers/507f1f77bcf86cd799439011/profilePicture/old.png',
          },
        },
      },
    });
    const refreshedUser = { id: userId };
    jest.spyOn(service, 'findById').mockResolvedValue(refreshedUser as any);
    mocks.azureBlobStorageService.getFileDetails.mockResolvedValue({
      fileName: 'farmers/507f1f77bcf86cd799439011/profilePicture/new.png',
      size: 2048,
      contentType: 'image/png',
      url: 'https://example/new.png',
      uploadedAt: new Date('2026-03-17T00:00:00.000Z'),
    });

    const result = await service.completeUpload(userId, {
      files: [
        {
          target: UserImageTarget.PROFILE_PICTURE,
          fileName: 'farmers/507f1f77bcf86cd799439011/profilePicture/new.png',
          size: 1024,
          mimeType: 'image/png',
        },
      ],
    });

    expect(mocks.userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      {
        'personalInfo.profilePicture': {
          filename:
            'farmers/507f1f77bcf86cd799439011/profilePicture/new.png',
          fileSize: '2048',
          mimeType: 'image/png',
        },
      },
      { new: true },
    );
    expect(mocks.azureBlobStorageService.deleteFile).toHaveBeenCalledWith(
      'farmers/507f1f77bcf86cd799439011/profilePicture/old.png',
    );
    expect(result).toBe(refreshedUser);
  });

  it('replaces land images as a single array update after verifying all blobs', async () => {
    const { service, mocks } = createService({
      user: {
        _id: { toString: () => userId },
        role: { name: 'landowner', _id: { toString: () => 'role-1' } },
        personalInfo: {},
      },
      landOwner: {
        _id: { toString: () => 'landowner-1' },
        landAddress: {
          landImages: [
            { filename: 'landowners/landowner-1/landImages/old-1.png' },
            { filename: 'landowners/landowner-1/landImages/old-2.png' },
          ],
        },
      },
    });
    jest.spyOn(service, 'findById').mockResolvedValue({ id: userId } as any);
    mocks.azureBlobStorageService.getFileDetails
      .mockResolvedValueOnce({
        fileName: 'landowners/landowner-1/landImages/new-1.png',
        size: 100,
        contentType: 'image/png',
        url: 'https://example/new-1.png',
        uploadedAt: new Date('2026-03-17T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        fileName: 'landowners/landowner-1/landImages/new-2.png',
        size: 200,
        contentType: 'image/png',
        url: 'https://example/new-2.png',
        uploadedAt: new Date('2026-03-17T00:00:00.000Z'),
      });

    await service.completeUpload(userId, {
      files: [
        {
          target: UserImageTarget.LAND_IMAGES,
          fileName: 'landowners/landowner-1/landImages/new-1.png',
          size: 100,
          mimeType: 'image/png',
        },
        {
          target: UserImageTarget.LAND_IMAGES,
          fileName: 'landowners/landowner-1/landImages/new-2.png',
          size: 200,
          mimeType: 'image/png',
        },
      ],
    });

    expect(mocks.landOwnerService.updateById).toHaveBeenCalledWith(
      'landowner-1',
      {
        'landAddress.landImages': [
          {
            filename: 'landowners/landowner-1/landImages/new-1.png',
            fileSize: '100',
            mimeType: 'image/png',
          },
          {
            filename: 'landowners/landowner-1/landImages/new-2.png',
            fileSize: '200',
            mimeType: 'image/png',
          },
        ],
      },
    );
    expect(mocks.azureBlobStorageService.deleteFile).toHaveBeenCalledWith(
      'landowners/landowner-1/landImages/old-1.png',
    );
    expect(mocks.azureBlobStorageService.deleteFile).toHaveBeenCalledWith(
      'landowners/landowner-1/landImages/old-2.png',
    );
  });

  it('does not persist or delete when blob verification fails', async () => {
    const { service, mocks } = createService();
    mocks.azureBlobStorageService.getFileDetails.mockRejectedValue(
      new BadRequestException('File not found'),
    );

    await expect(
      service.completeUpload(userId, {
        files: [
          {
            target: UserImageTarget.PROFILE_PICTURE,
            fileName: 'farmers/507f1f77bcf86cd799439011/profilePicture/new.png',
            size: 100,
            mimeType: 'image/png',
          },
        ],
      }),
    ).rejects.toThrow('File not found');

    expect(mocks.userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(mocks.azureBlobStorageService.deleteFile).not.toHaveBeenCalled();
  });
});
