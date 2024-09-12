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
import { Repository } from 'typeorm';
import { trxReqDto } from './models/notifyDto.model';
import { notify } from './models/notify.model';
import { trxReqSubscribeDetails } from 'src/trxReq/models/trxReqSubscribeDetails.model';
import { trxReqSubscribe } from 'src/trxReq/models/trxReqSubscribe.model';

const NOTIFY_INTERVAL = Number(process.env.NOTIFY_INTERVAL);

@Injectable()
export class NotifyService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(notify)
    private notifyRepository: Repository<notify>
  ) {}

  async createNotify(
    subDetails: trxReqSubscribeDetails,
    currRequest: trxReqSubscribe
  ) {
    const newNotify = new notify({
      wallet: currRequest.wallet.address,
      address: subDetails.address.address,
      subscribeType: subDetails.subscribe.subscribeType,
      status: subDetails.status,
      targetAmount: currRequest.amount,
      currAmount: subDetails.currAmount,
      lastTrxHash: subDetails.lastTrxHash,
      callbackUrl: currRequest.callbackUrl,
    });
    return await this.notifyRepository.save(newNotify);
  }

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

  async sendNotification(currAddressDetails: notify) {
    const {
      wallet,
      subscribeType,
      targetAmount,
      lastTrxHash,
      address,
      currAmount,
      status,
      callbackUrl,
    } = currAddressDetails;
    const body: trxReqDto = {
      wallet,
      subscribeType,
      targetAmount,
      lastTrxHash,
      address,
      currAmount,
      status,
    };
    const notifyRequest: AxiosRequestConfig = {
      method: 'post',
      url: callbackUrl,
      data: { ...body },
    };
    try {
      await this.sendData(notifyRequest);
      currAddressDetails.processed = true;
      await this.notifyRepository.save(currAddressDetails);
    } catch (err: any) {
      console.log(`Cannot notify to ${callbackUrl}: ${err}`);
    }
  }

  @Interval(NOTIFY_INTERVAL)
  async checkReadyRequests() {
    const chunkSize = 50;
    const readyReq = await this.notifyRepository
      .createQueryBuilder('notify')
      .where('notify.processed = :processed', { processed: false })
      .getMany();
    for (let i = 0; i < readyReq.length; i += chunkSize) {
      const chunk = readyReq.slice(i, i + chunkSize);
      const promises = chunk.map(async (currNotify) => {
        await this.sendNotification(currNotify);
      });
      await Promise.all(promises);
    }
  }
}
