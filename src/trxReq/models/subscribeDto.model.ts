import { trxReqSubscribe } from './trxReqSubscribe.model';

export class SubscribeDto {
  targetWallet: string;
  targetAmount: string;
  callbackUrl: string;
  createdAt: Date;
  constructor(trxRequest: Partial<trxReqSubscribe>) {
    const base = {
      targetWallet: trxRequest.wallet.address,
      targetAmount: trxRequest.amount,
      callbackUrl: trxRequest.callbackUrl,
      status: trxRequest.isActive,
    };
    Object.assign(this, base);
  }
}
