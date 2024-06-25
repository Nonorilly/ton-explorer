import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('trxReqWallet')
export class trxReqWallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  constructor(obj: Partial<trxReqWallet>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
