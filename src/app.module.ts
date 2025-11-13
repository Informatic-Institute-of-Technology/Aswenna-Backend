import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './config/database/database.module';
import { HealthModule } from './core/health/health.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    UserModule,
    RoleModule,
    PermissionModule,
  ],
})
export class AppModule {}
