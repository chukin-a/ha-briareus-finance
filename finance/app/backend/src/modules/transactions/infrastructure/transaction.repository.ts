import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TransactionEntity } from '../../../database/entities/transaction.entity';

@Injectable()
export class TransactionRepository extends Repository<TransactionEntity> {
  constructor(dataSource: DataSource) { super(TransactionEntity, dataSource.createEntityManager()); }
}
