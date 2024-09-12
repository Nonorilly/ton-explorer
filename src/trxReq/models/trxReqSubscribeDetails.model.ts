import { IsEnum, IsNumber } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { trxReqWallet } from './trxReqWallet.model';
import { trxReqSubscribe } from './trxReqSubscribe.model';

export enum SUBSCRIBE_DETAILS_STATUS {
  PENDING = 'PENDING',
  OVERFILLED = 'OVERFILLED',
}

@Entity('trxReqSubscribeDetails')
export class trxReqSubscribeDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric' })
  @IsNumber()
  currAmount: string;

  @Column()
  @IsEnum(SUBSCRIBE_DETAILS_STATUS)
  status: SUBSCRIBE_DETAILS_STATUS;

  @Column()
  lastTrxHash: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  lastTrxTime: Date;

  @ManyToOne(() => trxReqWallet, (trxReqSubscribe) => trxReqSubscribe.id)
  address: trxReqWallet;

  @ManyToOne(() => trxReqSubscribe, (trxReqSubscribe) => trxReqSubscribe.id)
  subscribe: trxReqSubscribe;

  constructor(obj: Partial<trxReqSubscribeDetails>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
