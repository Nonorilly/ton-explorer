import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from '@hapi/joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { trxReqModule } from './trxReq/trxReq.module';
import { ScheduleModule } from '@nestjs/schedule';
import { notifyModule } from './notify/notify.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.TYPEORM_HOST,
      port: Number(process.env.TYPEORM_PORT) || 5432,
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      entities: [process.env.TYPEORM_ENTITIES],
      synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
    }),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        TYPEORM_HOST: Joi.string().required(),
        TYPEORM_USERNAME: Joi.string().required(),
        TYPEORM_PASSWORD: Joi.string().required(),
        TYPEORM_DATABASE: Joi.string().required(),
        TYPEORM_PORT: Joi.number().required(),
        TYPEORM_ENTITIES: Joi.string().required(),
        TYPEORM_SYNCHRONIZE: Joi.bool().required(),
        CHECK_INTERVAL: Joi.number().required().greater(9999),
        NOTIFY_INTERVAL: Joi.number().required().greater(29999),
        TONCENTER_API_KEY: Joi.string().required(),
        API_LIMIT: Joi.number().required(),
      }),
    }),
    ScheduleModule.forRoot(),
    trxReqModule,
    notifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
