import { Test, TestingModule } from '@nestjs/testing';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { OtpType } from './schemas/otp.schema';

describe('OtpController', () => {
  let controller: OtpController;
  let otpService: {
    sendOtp: jest.Mock;
    verifyOtp: jest.Mock;
    resendOtp: jest.Mock;
  };

  beforeEach(async () => {
    otpService = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
      resendOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OtpController],
      providers: [
        {
          provide: OtpService,
          useValue: otpService,
        },
      ],
    }).compile();

    controller = module.get<OtpController>(OtpController);
  });

  it('sendOtp delegates to service', async () => {
    const dto = { type: OtpType.EMAIL, email: 'john@example.com' };
    const response = {
      success: true,
      message: 'OTP sent successfully to your email',
      expiresAt: new Date(),
    };
    otpService.sendOtp.mockResolvedValue(response);

    const result = await controller.sendOtp(dto as any);

    expect(otpService.sendOtp).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('verifyOtp delegates to service', async () => {
    const dto = {
      type: OtpType.EMAIL,
      email: 'john@example.com',
      code: '123456',
    };
    const response = {
      success: true,
      message: 'OTP verified successfully',
      verified: true,
    };
    otpService.verifyOtp.mockResolvedValue(response);

    const result = await controller.verifyOtp(dto as any);

    expect(otpService.verifyOtp).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('resendOtp delegates to service', async () => {
    const dto = { type: OtpType.PHONE, phone: '0771234567' };
    const response = {
      success: true,
      message: 'OTP sent successfully to your phone',
      expiresAt: new Date(),
    };
    otpService.resendOtp.mockResolvedValue(response);

    const result = await controller.resendOtp(dto as any);

    expect(otpService.resendOtp).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });
});
