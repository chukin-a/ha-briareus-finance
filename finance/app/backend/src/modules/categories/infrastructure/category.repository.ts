import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CategoryEntity } from '../../../database/entities/category.entity';

@Injectable()
export class CategoryRepository extends Repository<CategoryEntity> {
  constructor(dataSource: DataSource) { super(CategoryEntity, dataSource.createEntityManager()); }
}
