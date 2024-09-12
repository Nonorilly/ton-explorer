import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { trxReqWallet } from './models/trxReqWallet.model';
import {
  SUBSCRIBE_TYPE,
  trxReqSubscribe,
} from './models/trxReqSubscribe.model';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TrxReqService {
  constructor(
    @InjectRepository(trxReqSubscribe)
    private trxReqSubscribeRepository: Repository<trxReqSubscribe>,
    @InjectRepository(trxReqWallet)
    private trxReqWalletRepository: Repository<trxReqWallet>,
    @InjectRepository(trxReqWallet)
    private trxReqWallet: Repository<trxReqWallet>
  ) {}

  getRequestQB() {
    return this.trxReqSubscribeRepository
      .createQueryBuilder('trxReqSubscribe')
      .leftJoinAndSelect('trxReqSubscribe.wallet', 'trxReqWallet');
  }

  async findSubscribe(
    wallet: string,
    amount: string,
    callbackUrl: string,
    subscribeType: string
  ) {
    return this.getRequestQB()
      .where('"trxReqWallet"."address" = :wallet', { wallet })
      .andWhere('"trxReqSubscribe"."amount" = :amount', { amount })
      .andWhere('"trxReqSubscribe"."callbackUrl" = :callbackUrl', {
        callbackUrl,
      })
      .andWhere('"trxReqSubscribe"."subscribeType" = :subscribeType', {
        subscribeType,
      })
      .getOne();
  }

  async findWalletByAddress(address: string) {
    const wallet = this.trxReqWalletRepository.findOne({
      where: { address },
    });
    if (wallet) return wallet;
    else return null;
  }

  async createWallet(walletAddress: string) {
    const newWallet = new trxReqWallet({ address: walletAddress });
    return await this.trxReqWallet.save(newWallet);
  }

  async makeSubscribe({
    targetWallet,
    targetAmount,
    callbackUrl,
    subscribeType,
  }: {
    targetWallet: string;
    targetAmount: string;
    callbackUrl: string;
    subscribeType: string;
  }) {
    const existingSubscribe = await this.findSubscribe(
      targetWallet,
      targetAmount,
      callbackUrl,
      subscribeType
    );

    if (existingSubscribe) {
      if (!existingSubscribe.isActive) {
        existingSubscribe.isActive = true;
        existingSubscribe.subscribedAt = existingSubscribe.recheckedAt =
          new Date();
        return await this.trxReqSubscribeRepository.save(existingSubscribe);
      }
      throw new HttpException(
        'The subscription has already been activated',
        HttpStatus.OK
      );
    } else {
      // const getSubscribeType = (value) => {
      //   return Object.keys(SUBSCRIBE_TYPE).find(
      //     (r) => SUBSCRIBE_TYPE[r] === value
      //   );
      // };
      const newSubscribe = new trxReqSubscribe({
        amount: targetAmount,
        callbackUrl: callbackUrl,
        //subscribeType: SUBSCRIBE_TYPE[getSubscribeType(subscribeType)],
        subscribeType: SUBSCRIBE_TYPE[subscribeType],
      });
      const existingWallet = await this.findWalletByAddress(targetWallet);
      if (existingWallet != null) {
        newSubscribe.wallet = existingWallet;
      } else {
        newSubscribe.wallet = await this.trxReqWalletRepository.save({
          address: targetWallet,
        });
      }
      return this.trxReqSubscribeRepository.save(newSubscribe);
    }
  }

  async makeUnsubscribe({
    targetWallet,
    targetAmount,
    callbackUrl,
    subscribeType,
  }: {
    targetWallet: string;
    targetAmount: string;
    callbackUrl: string;
    subscribeType: string;
  }) {
    const existingSubscribe = await this.findSubscribe(
      targetWallet,
      targetAmount,
      callbackUrl,
      subscribeType
    );
    if (existingSubscribe) {
      if (existingSubscribe.isActive) {
        existingSubscribe.isActive = false;
        return this.trxReqSubscribeRepository.save(existingSubscribe);
      } else {
        throw new HttpException(
          'the subscription has already been deactivated',
          HttpStatus.CONFLICT
        );
      }
    } else {
      throw new BadRequestException('incorrect unsubscribe parameters');
    }
  }
}
