import {
  SUBSCRIBE_TYPE,
  trxReqSubscribe,
} from 'src/trxReq/models/trxReqSubscribe.model';

export class notifySubscribeDto {
  amount: string;
  subscribeType: SUBSCRIBE_TYPE;
  wallet: string;
  constructor(trxSubscribe: Partial<trxReqSubscribe>) {
    const base = {
      amount: trxSubscribe.amount,
      subscribeType: trxSubscribe.subscribeType,
      wallet: trxSubscribe.wallet.address,
    };
    Object.assign(this, base);
  }
}
