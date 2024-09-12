import { IsBoolean, IsEnum } from 'class-validator';
import { SUBSCRIBE_TYPE } from 'src/trxReq/models/trxReqSubscribe.model';
import { SUBSCRIBE_DETAILS_STATUS } from 'src/trxReq/models/trxReqSubscribeDetails.model';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notify')
export class notify {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  callbackUrl: string;

  @Column()
  @IsEnum(SUBSCRIBE_TYPE)
  subscribeType: SUBSCRIBE_TYPE;

  @Column()
  wallet: string;

  @Column()
  targetAmount: string;

  @Column()
  currAmount: string;

  @Column()
  lastTrxHash: string;

  @Column()
  address: string;

  @Column()
  @IsEnum(SUBSCRIBE_DETAILS_STATUS)
  status: SUBSCRIBE_DETAILS_STATUS;

  @Column({ default: false })
  @IsBoolean()
  processed: boolean;

  @CreateDateColumn()
  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  constructor(obj: Partial<notify>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
