import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { Otp, OtpType } from './schemas/otp.schema';
import { NotificationService } from '../notification/notification.service';

describe('OtpService', () => {
  let service: OtpService;
  let otpModel: {
    updateMany: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    updateOne: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let notificationService: {
    sendEmail: jest.Mock;
    sendSms: jest.Mock;
  };

  beforeEach(async () => {
    otpModel = {
      updateMany: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'OTP_EXPIRATION_MINUTES') return 5;
        if (key === 'OTP_MAX_ATTEMPTS') return 5;
        return undefined;
      }),
    };

    notificationService = {
      sendEmail: jest.fn(),
      sendSms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getModelToken(Otp.name),
          useValue: otpModel,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('sendOtp', () => {
    it('sends email OTP and returns success response', async () => {
      otpModel.updateMany.mockResolvedValue({});
      otpModel.create.mockResolvedValue({});
      notificationService.sendEmail.mockResolvedValue(undefined);

      const result = await service.sendOtp({
        type: OtpType.EMAIL,
        email: 'john@example.com',
      } as any);

      expect(otpModel.updateMany).toHaveBeenCalledWith(
        {
          identifier: 'john@example.com',
          type: OtpType.EMAIL,
          isUsed: false,
        },
        { isUsed: true },
      );
      expect(otpModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'john@example.com',
          type: OtpType.EMAIL,
          code: expect.any(String),
          isUsed: false,
          expiresAt: expect.any(Date),
        }),
      );
      expect(notificationService.sendEmail).toHaveBeenCalledWith(
        'john@example.com',
        'Aswenna - Your Verification Code',
        expect.stringContaining('verification code'),
      );
      expect(result.success).toBe(true);
      expect(result.verified).toBeUndefined();
    });

    it('sends phone OTP via sms', async () => {
      otpModel.updateMany.mockResolvedValue({});
      otpModel.create.mockResolvedValue({});
      notificationService.sendSms.mockResolvedValue(undefined);

      await service.sendOtp({
        type: OtpType.PHONE,
        phone: '0771234567',
      } as any);

      expect(notificationService.sendSms).toHaveBeenCalledWith(
        '0771234567',
        expect.stringContaining('verification code'),
      );
      expect(notificationService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('verifies immediately for bypass code 000000', async () => {
      const result = await service.verifyOtp({
        type: OtpType.EMAIL,
        email: 'john@example.com',
        code: '000000',
      } as any);

      expect(result).toEqual({
        success: true,
        message: 'OTP verified successfully',
        verified: true,
      });
      expect(otpModel.findOne).not.toHaveBeenCalled();
    });

    it('verifies valid OTP and marks it used', async () => {
      const otpRecord = {
        _id: 'otp-id',
        isUsed: false,
        expiresAt: new Date(Date.now() + 60_000),
      };

      otpModel.findOne.mockResolvedValue(otpRecord);
      otpModel.updateOne.mockResolvedValue({});

      const result = await service.verifyOtp({
        type: OtpType.EMAIL,
        email: 'john@example.com',
        code: '123456',
      } as any);

      expect(otpModel.findOne).toHaveBeenCalledWith({
        identifier: 'john@example.com',
        type: OtpType.EMAIL,
        code: '123456',
      });
      expect(otpModel.updateOne).toHaveBeenCalledWith(
        { _id: 'otp-id' },
        { isUsed: true, verifiedAt: expect.any(Date) },
      );
      expect(result.verified).toBe(true);
    });

    it('throws when otp code is invalid', async () => {
      otpModel.findOne.mockResolvedValue(null);

      await expect(
        service.verifyOtp({
          type: OtpType.EMAIL,
          email: 'john@example.com',
          code: '123456',
        } as any),
      ).rejects.toThrow(
        new BadRequestException(
          'Invalid OTP code. Please check and try again.',
        ),
      );
    });

    it('throws when otp is already used', async () => {
      otpModel.findOne.mockResolvedValue({
        _id: 'otp-id',
        isUsed: true,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.verifyOtp({
          type: OtpType.PHONE,
          phone: '0771234567',
          code: '123456',
        } as any),
      ).rejects.toThrow(
        new BadRequestException(
          'This OTP has already been used. Please request a new one.',
        ),
      );
    });

    it('throws when otp is expired', async () => {
      otpModel.findOne.mockResolvedValue({
        _id: 'otp-id',
        isUsed: false,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(
        service.verifyOtp({
          type: OtpType.PHONE,
          phone: '0771234567',
          code: '123456',
        } as any),
      ).rejects.toThrow(
        new BadRequestException('OTP has expired. Please request a new one.'),
      );
    });
  });

  describe('resendOtp', () => {
    it('delegates to sendOtp', async () => {
      const sendSpy = jest.spyOn(service, 'sendOtp').mockResolvedValue({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresAt: new Date(),
      });

      const dto = { type: OtpType.EMAIL, email: 'john@example.com' } as any;
      const result = await service.resendOtp(dto);

      expect(sendSpy).toHaveBeenCalledWith(dto);
      expect(result.success).toBe(true);
    });
  });
});
