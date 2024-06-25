import { IsNotEmpty, IsString } from 'class-validator';

export class SubscribeWalletDto {
  @IsString()
  @IsNotEmpty()
  targetWallet: string;

  @IsString()
  @IsNotEmpty()
  targetAmount: string;

  @IsString()
  @IsNotEmpty()
  callbackUrl: string;
}
