import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret =
          configService.get<string>('jwt.secret') || 'defaultSecret';
        const expiration = configService.get<string>('jwt.expiration') || '1h';

        return {
          secret,
          signOptions: {
            expiresIn: expiration as any,
          },
        };
      },
      inject: [ConfigService],
      global: true,
    }),
  ],
})
export class JwtConfigModule {}
