import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotifyService } from './notify.service';
import { notify } from './models/notify.model';

@Module({
  imports: [TypeOrmModule.forFeature([notify]), ConfigModule, HttpModule],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
