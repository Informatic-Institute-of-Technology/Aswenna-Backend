import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import { Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mailerService: {
    sendMail: jest.Mock;
  };

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: MailerService,
          useValue: mailerService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('sends email via MailerService and logs success', async () => {
      const logSpy = jest.spyOn(Logger, 'log').mockImplementation();
      mailerService.sendMail.mockResolvedValue(undefined);

      await service.sendEmail('john@example.com', 'Welcome', 'Hello there');

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        from: '"Aswenna System" <no-reply@aswenna.lk>',
        to: 'john@example.com',
        subject: 'Welcome',
        text: 'Hello there',
      });
      expect(logSpy).toHaveBeenCalledWith(
        'Email sent to john@example.com',
        'NotificationService',
      );
    });

    it('logs error when email send fails', async () => {
      const errorSpy = jest.spyOn(Logger, 'error').mockImplementation();
      const failure = new Error('smtp unavailable');
      mailerService.sendMail.mockRejectedValue(failure);

      await service.sendEmail('john@example.com', 'Welcome', 'Hello there');

      expect(errorSpy).toHaveBeenCalledWith(
        'Email sending failed',
        failure,
        'NotificationService',
      );
    });
  });

  describe('sendSms', () => {
    it('logs sms dispatch message', async () => {
      const logSpy = jest.spyOn(Logger, 'log').mockImplementation();

      await service.sendSms('0771234567', 'OTP 123456');

      expect(logSpy).toHaveBeenCalledWith(
        'SMS sent to 0771234567: OTP 123456',
        'NotificationService',
      );
    });
  });
});
