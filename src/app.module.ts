import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ThrottlerModule } from '@nestjs/throttler';
import { appConfig, AppConfig } from './config/app.config';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    PaymentsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig =
          configService.get<AppConfig['database']>('app.database');

        return {
          type: 'mysql',
          host: dbConfig?.host,
          port: dbConfig?.port,
          username: dbConfig?.username,
          password: dbConfig?.password,
          database: dbConfig?.name,
          autoLoadEntities: true,
          synchronize: true, // Only for development
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
