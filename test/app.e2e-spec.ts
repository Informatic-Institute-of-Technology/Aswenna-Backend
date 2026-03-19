import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { LEGACY_UPLOAD_MAX_FILE_SIZE_BYTES } from '../src/common/constants/upload.constants';
import { AzureBlobStorageService } from '../src/config/azure/services/azure-blob-storage.service';
import { FileUploadController } from '../src/modules/file-upload/file-upload.controller';
import { FarmerService } from '../src/modules/farmer/farmer.service';
import { InvestorService } from '../src/modules/investor/investor.service';
import { LandOwnerService } from '../src/modules/land-owner/land-owner.service';
import { RoleService } from '../src/modules/role/role.service';
import { UserController } from '../src/modules/user/user.controller';
import { User, UserImageTarget } from '../src/modules/user/schemas/user.schema';
import { UserService } from '../src/modules/user/user.service';

describe('Upload endpoints (e2e)', () => {
  let app: INestApplication;
  const userId = '507f1f77bcf86cd799439011';

  const createExec = <T>(value: T) => ({
    exec: jest.fn().mockResolvedValue(value),
  });

  beforeAll(async () => {
    const userModel = {
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(
            createExec({
              _id: { toString: () => userId },
              role: { name: 'farmer', _id: { toString: () => 'role-1' } },
              personalInfo: {},
            }),
          ),
        }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue(createExec({})),
      deleteOne: jest.fn().mockReturnValue(createExec({ deletedCount: 1 })),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };
    const farmerService = {
      create: jest.fn(),
      updateById: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue({
        _id: { toString: () => 'farmer-1' },
      }),
    };
    const investorService = {
      create: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue(null),
    };
    const landOwnerService = {
      create: jest.fn(),
      updateById: jest.fn(),
      findByUserId: jest.fn(),
    };
    const roleService = {
      findByName: jest.fn(),
      findById: jest.fn(),
    };
    const azureBlobStorageService = {
      createBlobFileName: jest
        .fn()
        .mockReturnValue(
          'farmers/farmer-1/profilePicture/generated-profile.png',
        ),
      generateUploadUrl: jest.fn().mockResolvedValue({
        url: 'https://upload.example',
        expiresIn: 15,
        fileName: 'farmers/farmer-1/profilePicture/generated-profile.png',
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'x-ms-blob-type': 'BlockBlob',
        },
      }),
      getFileDetails: jest.fn(),
      deleteFile: jest.fn(),
      getFileUrl: jest.fn(),
      uploadFile: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController, FileUploadController],
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: RoleService, useValue: roleService },
        { provide: FarmerService, useValue: farmerService },
        { provide: InvestorService, useValue: investorService },
        { provide: LandOwnerService, useValue: landOwnerService },
        {
          provide: AzureBlobStorageService,
          useValue: azureBlobStorageService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns upload instructions with server-generated file names and PUT headers', async () => {
    const response = await request(app.getHttpServer())
      .post(`/user/${userId}/upload-requests`)
      .send({
        files: [
          {
            target: UserImageTarget.PROFILE_PICTURE,
            originalName: 'profile.png',
            contentType: 'image/png',
            size: 1024,
          },
        ],
      })
      .expect(201);

    expect(response.body).toEqual({
      files: [
        {
          target: UserImageTarget.PROFILE_PICTURE,
          fileName: 'farmers/farmer-1/profilePicture/generated-profile.png',
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

  it('rejects oversized legacy user uploads with 413', async () => {
    await request(app.getHttpServer())
      .post(`/user/${userId}/upload`)
      .attach(
        UserImageTarget.PROFILE_PICTURE,
        Buffer.alloc(LEGACY_UPLOAD_MAX_FILE_SIZE_BYTES + 1, 1),
        {
          filename: 'too-large.bin',
          contentType: 'application/octet-stream',
        },
      )
      .expect(413);
  });

  it('rejects oversized legacy file-upload requests with 413', async () => {
    await request(app.getHttpServer())
      .post('/file-upload/upload')
      .attach(
        'file',
        Buffer.alloc(LEGACY_UPLOAD_MAX_FILE_SIZE_BYTES + 1, 1),
        {
          filename: 'too-large.bin',
          contentType: 'application/octet-stream',
        },
      )
      .expect(413);
  });
});
