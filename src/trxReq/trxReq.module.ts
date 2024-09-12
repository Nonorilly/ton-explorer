import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { trxReqSubscribe } from './models/trxReqSubscribe.model';
import { trxReqWallet } from './models/trxReqWallet.model';
import { TrxReqService } from './trxReq.service';
import { TrxReqProcessorService } from './trxReqProcessor.service';
import { TrxReqController } from './trxReq.controller';
import { trxReqSubscribeDetails } from './models/trxReqSubscribeDetails.model';
import { NotifyModule } from 'src/notify/notify.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      trxReqSubscribe,
      trxReqSubscribeDetails,
      trxReqWallet,
    ]),
    ConfigModule,
    NotifyModule,
  ],
  providers: [TrxReqService, TrxReqProcessorService],
  exports: [],
  controllers: [TrxReqController],
})
export class TrxReqModule {}
