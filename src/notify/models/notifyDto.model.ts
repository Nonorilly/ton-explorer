import { trxReqSubscribe } from '../../trxReq/models/trxReqSubscribe.model';

export class trxReqDto {
  wallet: string;
  address: string;
  targetAmount: string;
  currAmount: string;
  lastTrxHash: string;
  lastTrxTime: Date;
  constructor(trxRequest: Partial<trxReqSubscribe>) {
    const base = {
      ...trxRequest,
    };
    Object.assign(this, base);
  }
}
