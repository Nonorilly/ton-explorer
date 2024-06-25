import { IsBoolean, IsNumber } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { trxReqWallet } from './trxReqWallet.model';
import { trxReqSubscribeDetails } from './trxReqSubscribeDetails.model';

@Entity('trxReqSubscribe')
export class trxReqSubscribe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric' })
  @IsNumber()
  amount: string;

  @Column()
  callbackUrl: string;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @CreateDateColumn()
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  subscribedAt: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  recheckedAt: Date;

  @ManyToOne(() => trxReqWallet, (trxReqWallet) => trxReqWallet.address)
  wallet: trxReqWallet;

  @OneToMany(() => trxReqSubscribeDetails, (details) => details.subscribe)
  details: trxReqSubscribeDetails[];

  constructor(obj: Partial<trxReqSubscribe>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
