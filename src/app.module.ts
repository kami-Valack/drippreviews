import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiPingModule } from './api-ping/api-ping.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ApiPingModule,
    ProductsModule,
  ],
})
export class AppModule {}
