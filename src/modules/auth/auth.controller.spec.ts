import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('delegates to authService.login with email and password', async () => {
      const dto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const authResult = {
        access_token: 'mock-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      authService.login.mockResolvedValue(authResult);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(authResult);
    });
  });
});
