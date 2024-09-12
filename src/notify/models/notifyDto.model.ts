import { SUBSCRIBE_TYPE } from 'src/trxReq/models/trxReqSubscribe.model';
import { notify } from './notify.model';
import { SUBSCRIBE_DETAILS_STATUS } from 'src/trxReq/models/trxReqSubscribeDetails.model';

export class trxReqDto {
  wallet: string;
  address: string;
  subscribeType: SUBSCRIBE_TYPE;
  status: SUBSCRIBE_DETAILS_STATUS;
  targetAmount: string;
  currAmount: string;
  lastTrxHash: string;
  constructor(reqNotify: Partial<notify>) {
    const base = {
      ...reqNotify,
    };
    Object.assign(this, base);
  }
}
