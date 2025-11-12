import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const globalPrefix = configService.get<string>('app.apiPrefix') || 'api';
  const port = configService.get<number>('app.port') || 3000;

  app.setGlobalPrefix(globalPrefix);
  await app.listen(port);

  Logger.debug(
    `Server is running on: http://localhost:${port}/${globalPrefix}`,
    'Aswenna',
  );
}

bootstrap().catch((error) => {
  Logger.error('Failed to bootstrap the application', error, 'Aswenna');
  process.exit(1);
});
