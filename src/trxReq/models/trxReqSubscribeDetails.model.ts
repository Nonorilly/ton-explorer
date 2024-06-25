import { IsBoolean, IsNumber } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { trxReqWallet } from './trxReqWallet.model';
import { trxReqSubscribe } from './trxReqSubscribe.model';

@Entity('trxReqSubscribeDetails')
export class trxReqSubscribeDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric' })
  @IsNumber()
  currAmount: string;

  @Column({ default: false })
  @IsBoolean()
  isAchieved: boolean;

  @Column({ default: false })
  @IsBoolean()
  isNotified: boolean;

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
