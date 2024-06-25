import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { trxReqSubscribe } from 'src/trxReq/models/trxReqSubscribe.model';
import { trxReqSubscribeDetails } from 'src/trxReq/models/trxReqSubscribeDetails.model';
import { Repository } from 'typeorm';
import { trxReqDto } from './models/notifyDto.model';

const NOTIFY_INTERVAL = Number(process.env.NOTIFY_INTERVAL);
@Injectable()
export class notifyService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(trxReqSubscribeDetails)
    private trxReqSubscribeDetailsRepository: Repository<trxReqSubscribeDetails>
  ) {}

  async sendData(config: AxiosRequestConfig) {
    try {
      const response = await firstValueFrom(this.httpService.request(config));
      const data = response.data;
      return data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      } else {
        throw new InternalServerErrorException(error);
      }
    }
  }

  async sendNotification(
    currAddressDetails: trxReqSubscribeDetails,
    subscribe: trxReqSubscribe
  ) {
    const { currAmount, lastTrxHash, lastTrxTime, address } =
      currAddressDetails;
    const { wallet, callbackUrl, amount } = subscribe;
    const body: trxReqDto = {
      wallet: wallet.address,
      address: address.address,
      targetAmount: amount,
      currAmount,
      lastTrxHash,
      lastTrxTime,
    };
    const notifyRequest: AxiosRequestConfig = {
      method: 'post',
      url: callbackUrl,
      data: { ...body },
    };
    try {
      await this.sendData(notifyRequest);
      currAddressDetails.isNotified = true;
      await this.trxReqSubscribeDetailsRepository.save(currAddressDetails);
    } catch (err: any) {
      console.log(`Cannot notify to ${subscribe.callbackUrl}: ${err}`);
    }
  }

  @Interval(NOTIFY_INTERVAL)
  async checkReadyRequests() {
    const chunkSize = 50;
    const readyReq = await this.trxReqSubscribeDetailsRepository
      .createQueryBuilder('trxReqSubscribeDetails')
      .leftJoinAndSelect('trxReqSubscribeDetails.subscribe', 'trxReqSubscribe')
      .leftJoinAndSelect('trxReqSubscribe.wallet', 'trxWallet')
      .leftJoinAndSelect('trxReqSubscribeDetails.address', 'trxAddress')
      .where('trxReqSubscribe.isActive = :isActive', { isActive: true })
      .andWhere('trxReqSubscribeDetails.isAchieved = :isAchieved', {
        isAchieved: true,
      })
      .andWhere('trxReqSubscribeDetails.isNotified = :isNotified', {
        isNotified: false,
      })
      .getMany();
    for (let i = 0; i < readyReq.length; i += chunkSize) {
      const chunk = readyReq.slice(i, i + chunkSize);
      const promises = chunk.map(async (currReq) => {
        await this.sendNotification(currReq, currReq.subscribe);
      });
      await Promise.all(promises);
    }
  }
}
