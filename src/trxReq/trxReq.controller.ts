import { Body, Controller, Post } from '@nestjs/common';
import { SubscribeWalletDto } from './models/subscribeWalletDto.model';
import { SubscribeDto } from './models/subscribeDto.model';
import { TrxReqService } from './trxReq.service';

@Controller()
export class trxReqController {
  constructor(private readonly trxRequestService: TrxReqService) {}

  async makeSubscribe(@Body() input: SubscribeWalletDto) {
    const { targetWallet, targetAmount, callbackUrl } = input;
    const res = await this.trxRequestService.makeSubscribe({
      targetWallet,
      targetAmount,
      callbackUrl,
    });
    return res;
  }

  async makeUnsubscribe(@Body() input: SubscribeWalletDto) {
    // нужна ли отдельная дто?
    const { targetWallet, targetAmount, callbackUrl } = input;
    const res = await this.trxRequestService.makeUnsubscribe({
      targetWallet,
      targetAmount,
      callbackUrl,
    });
    return res;
  }

  @Post('subscribe')
  async subscribe(@Body() input: SubscribeWalletDto) {
    const req = await this.makeSubscribe(input);
    return new SubscribeDto(req);
  }

  @Post('unsubscribe')
  async unsubscribe(@Body() input: SubscribeWalletDto) {
    const req = await this.makeUnsubscribe(input);
    return new SubscribeDto(req);
  }
}
