import { trxReqWallet } from 'src/trxReq/models/trxReqWallet.model';

export class notifyWalletDto {
  address: string;
  constructor(trxWallet: Partial<trxReqWallet>) {
    const base = {
      targetWallet: trxWallet.address,
    };
    Object.assign(this, base);
  }
}
