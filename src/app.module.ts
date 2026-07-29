import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    //Con esta configuración solo estamos permitiendo 15 peticiones por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 25,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('POSTGRES_USER', 'postgres'),
        password: configService.get<string>('POSTGRES_PASSWORD', ''),
        database: configService.get<string>('POSTGRES_DB', 'varchat_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    JwtModule.register({global: true}),
    AuthModule,
  ],
  
  providers: [
  { provide: 'APP_GUARD', useClass: ThrottlerGuard },
  { provide: 'APP_GUARD', useClass: JwtAuthGuard },
  { provide: 'APP_GUARD', useClass: RolesGuard },
],
})
export class AppModule {}
