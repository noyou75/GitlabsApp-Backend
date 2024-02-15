import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditEntity } from '../../entities/credit.entity';
import { CreditService } from './services/credit.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreditEntity])],
  providers: [
    CreditService,
  ],
  exports: [
    CreditService,
  ]
})
export class CreditModule {

}
