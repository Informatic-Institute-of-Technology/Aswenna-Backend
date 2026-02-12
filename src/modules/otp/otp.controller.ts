import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/generate.otp.dto';
import { VerifyOtpDto } from './dto/validate.otp.dto';
import { Public } from '../../core/decorators/public.decorator';

@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @Public()
  async sendOtp(@Body() sendOtp: SendOtpDto) {
    return this.otpService.sendOtp(sendOtp);
  }

  @Post('verify')
  @Public()
  async verifyOtp(@Body() verifyOtp: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtp);
  }

  @Post('resend')
  @Public()
  async resendOtp(@Body() resendOtp: SendOtpDto) {
    return this.otpService.resendOtp(resendOtp);
  }
}
