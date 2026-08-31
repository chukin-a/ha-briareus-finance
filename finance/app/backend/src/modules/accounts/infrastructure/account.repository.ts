import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AccountEntity } from '../../../database/entities/account.entity';

@Injectable()
export class AccountRepository extends Repository<AccountEntity> {
  constructor(dataSource: DataSource) { super(AccountEntity, dataSource.createEntityManager()); }
}
