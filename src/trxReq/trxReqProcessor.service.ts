import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import TonWeb from 'tonweb';
import {
  SUBSCRIBE_TYPE,
  trxReqSubscribe,
} from './models/trxReqSubscribe.model';
import { Repository } from 'typeorm';
import { RateLimiter } from 'limiter';
import {
  SUBSCRIBE_DETAILS_STATUS,
  trxReqSubscribeDetails,
} from './models/trxReqSubscribeDetails.model';
import BigNumber from 'bignumber.js';
import { TrxReqService } from './trxReq.service';
import { NotifyService } from 'src/notify/notify.service';

const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL);
const API_LIMIT = Number(process.env.API_LIMIT);

@Injectable()
export class TrxReqProcessorService {
  private tonweb = new TonWeb(
    new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {
      apiKey: process.env.TONCENTER_API_KEY,
    })
  );
  private limiter = new RateLimiter({
    tokensPerInterval: API_LIMIT,
    interval: 'second',
  });
  constructor(
    private trxReqService: TrxReqService,
    private notifyService: NotifyService,
    @InjectRepository(trxReqSubscribe)
    private trxReqSubscribeRepository: Repository<trxReqSubscribe>,
    @InjectRepository(trxReqSubscribeDetails)
    private trxReqSubscribeDetailsRepository: Repository<trxReqSubscribeDetails>
  ) {}

  getRequestQB() {
    return this.trxReqSubscribeRepository
      .createQueryBuilder('trxReqSubscribe')
      .leftJoinAndSelect('trxReqSubscribe.wallet', 'trxReqWallet');
  }

  async findAddresesInDetails(sub: trxReqSubscribe) {
    const addresses = await this.trxReqSubscribeDetailsRepository
      .createQueryBuilder('trxReqSubscribeDetails')
      .leftJoinAndSelect('trxReqSubscribeDetails.address', 'trxReqWallet')
      .leftJoinAndSelect('trxReqSubscribeDetails.subscribe', 'trxReqSubscribe')
      .where('trxReqSubscribe.id = :subid', { subid: sub.id })
      .andWhere('trxReqSubscribeDetails.status = :status', {
        status: SUBSCRIBE_DETAILS_STATUS.PENDING,
      })
      .getMany();
    return addresses;
  }

  async isAchievedAmount(currAmount: string, targetAmount: string) {
    return new BigNumber(currAmount).isGreaterThanOrEqualTo(
      new BigNumber(targetAmount)
    );
  }

  async makeNewObj(transaction: any, currRequest: trxReqSubscribe) {
    const walletAddress = transaction.in_msg.source;
    if (walletAddress) {
      const newWallet =
        (await this.trxReqService.findWalletByAddress(walletAddress)) ??
        (await this.trxReqService.createWallet(walletAddress));
      const newObj = new trxReqSubscribeDetails({
        currAmount: new BigNumber(transaction.in_msg.value)
          .dividedBy(1e9)
          .toString(),
        lastTrxHash: transaction.transaction_id.hash,
        lastTrxTime: new Date(transaction.utime * 1000),
        subscribe: currRequest,
        address: newWallet,
      });
      if (await this.isAchievedAmount(newObj.currAmount, currRequest.amount)) {
        newObj.status = SUBSCRIBE_DETAILS_STATUS.OVERFILLED;
      } else {
        newObj.status = SUBSCRIBE_DETAILS_STATUS.PENDING;
      }
      return newObj;
    }
    return null;
  }

  @Interval(CHECK_INTERVAL)
  async checkRequests() {
    const trxReqs = await this.getRequestQB()
      .where('trxReqSubscribe.isActive = :isActive', {
        isActive: true,
      })
      .getMany();

    const chunkSize = 50;
    for (let i = 0; i < trxReqs.length; i += chunkSize) {
      const chunk = trxReqs.slice(i, i + chunkSize);
      const promises = chunk.map(async (currRequest) => {
        const addreses = await this.findAddresesInDetails(currRequest);
        // ratelimit exceed сделать предупреждение?
        await this.limiter.removeTokens(1);
        const walletTransactions = await this.tonweb.getTransactions(
          currRequest.wallet.address,
          256 // 256 max tonweb не маловато ли в минуту?
        );
        let lastIdx = -1; // tonweb не может сортировать при запросе транзакции по возрастанию времени, а тонцентр апи может
        for (let j = 0; j < walletTransactions.length; j++) {
          if (
            walletTransactions[j].utime * 1000 <
            currRequest.recheckedAt.valueOf()
          ) {
            break;
          } else lastIdx++;
        }

        for (let j = lastIdx; j >= 0; j--) {
          const transaction = walletTransactions[j];
          if (transaction.in_msg) {
            switch (currRequest.subscribeType) {
              case SUBSCRIBE_TYPE.MULTIPLE:
                const updObj = addreses.find(
                  (o) => o.address.address === transaction.in_msg.source
                );
                if (updObj) {
                  updObj.currAmount = new BigNumber(updObj.currAmount)
                    .plus(
                      new BigNumber(transaction.in_msg.value).dividedBy(1e9)
                    )
                    .toString();
                  updObj.lastTrxHash = transaction.transaction_id.hash;
                  updObj.lastTrxTime = new Date(transaction.utime * 1000);
                  if (
                    await this.isAchievedAmount(
                      updObj.currAmount,
                      currRequest.amount
                    )
                  ) {
                    updObj.status = SUBSCRIBE_DETAILS_STATUS.OVERFILLED;
                    addreses[
                      addreses.findIndex((el) => el.address === updObj.address)
                    ] = updObj;
                  }
                  await this.notifyService.createNotify(updObj, currRequest);
                } else {
                  const newObj = await this.makeNewObj(
                    transaction,
                    currRequest
                  );
                  if (newObj) {
                    addreses.push(newObj);
                    await this.notifyService.createNotify(newObj, currRequest);
                  }
                }
                break;
              case SUBSCRIBE_TYPE.SINGLE:
                const newObj = await this.makeNewObj(transaction, currRequest);
                if (newObj?.status === SUBSCRIBE_DETAILS_STATUS.OVERFILLED) {
                  addreses.push(newObj);
                  await this.notifyService.createNotify(newObj, currRequest);
                }
                break;
            }
          }
        }

        await this.trxReqSubscribeDetailsRepository.save(addreses);
        currRequest.recheckedAt = new Date();
        await this.trxReqSubscribeRepository.save(currRequest);
      });
      await Promise.all(promises);
    }
  }
}
