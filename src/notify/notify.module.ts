import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { trxReqSubscribe } from '../trxReq/models/trxReqSubscribe.model';
import { trxReqSubscribeDetails } from '../trxReq/models/trxReqSubscribeDetails.model';
import { trxReqWallet } from '../trxReq/models/trxReqWallet.model';
import { notifyService } from './notify.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      trxReqSubscribe,
      trxReqSubscribeDetails,
      trxReqWallet,
    ]),
    ConfigModule,
    HttpModule,
  ],
  providers: [notifyService],
  exports: [],
  controllers: [],
})
export class notifyModule {}
