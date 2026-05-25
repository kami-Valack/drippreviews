import { Module } from '@nestjs/common';
import { ApiPingService } from './api-ping.service';

@Module({
  providers: [ApiPingService],
})
export class ApiPingModule {}
