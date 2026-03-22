import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/schemas/user.schema';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findByEmailWithPassword: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  const email = 'john@example.com';
  const password = 'password123';

  const activeUser = {
    _id: { toString: () => '67d3e18216f3ec23296ef77a' },
    email,
    password: 'hashed-password',
    status: UserStatus.Active,
    role: { name: 'ADMIN' },
  };

  beforeEach(async () => {
    userService = {
      findByEmailWithPassword: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns access token payload for valid credentials', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      configService.get.mockImplementation((key: string) => {
        if (key === 'jwt.expiration') return '1h';
        return undefined;
      });
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.login(email, password);

      expect(userService.findByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        activeUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: activeUser._id.toString(),
        email: activeUser.email,
        role: 'admin',
      });
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when account is inactive', async () => {
      userService.findByEmailWithPassword.mockResolvedValue({
        ...activeUser,
        status: UserStatus.Inactive,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(email, password)).rejects.toThrow(
        new UnauthorizedException('Account is inactive'),
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('omits role in token payload when role is missing', async () => {
      const userWithoutRole = {
        ...activeUser,
        role: undefined,
      };

      userService.findByEmailWithPassword.mockResolvedValue(userWithoutRole);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      configService.get.mockReturnValue('1d');
      jwtService.signAsync.mockResolvedValue('token-without-role');

      await service.login(email, password);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: activeUser._id.toString(),
        email: activeUser.email,
      });
    });
  });
});
