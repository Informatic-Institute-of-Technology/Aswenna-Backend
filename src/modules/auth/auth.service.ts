import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { parseDurationToSeconds } from 'src/common/utils/time.util';
import { AuthPayloadI } from './auth.types';
import { UserStatus } from '../user/schemas/user.schema';

const T = {
  invalidCredentials: 'Invalid credentials',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException(T.invalidCredentials);

    if (user.status !== UserStatus.Active)
      throw new UnauthorizedException('Account is inactive');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) throw new UnauthorizedException(T.invalidCredentials);

    const payload: AuthPayloadI = {
      sub: user._id.toString(),
      email: user.email,
    };

    if (user.role) {
      const role = user.role;

      if (role.name) payload.role = role.name.toLowerCase();
    }

    const expiresIn = parseDurationToSeconds(
      this.configService.get<string>('jwt.expiration'),
    );

    return {
      access_token: await this.jwtService.signAsync(payload),
      expires_in: expiresIn,
      token_type: 'Bearer',
    };
  }
}
