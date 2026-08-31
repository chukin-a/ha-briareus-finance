import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialFinanceSchema1710000000000 implements MigrationInterface {
  name = 'InitialFinanceSchema1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS users (id varchar(64) PRIMARY KEY, name varchar(255) NOT NULL, created_at varchar(64) NOT NULL)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS projects (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, name varchar(255) NOT NULL, planned_amount_minor integer NOT NULL DEFAULT 0, currency varchar(8) NOT NULL, created_at varchar(64) NOT NULL)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS accounts (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, name varchar(255) NOT NULL, type varchar(32) NOT NULL, currency varchar(8) NOT NULL, credit_limit_minor integer, grace_period_rule varchar(32), grace_period_day integer, created_at varchar(64) NOT NULL)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS categories (id varchar(64) PRIMARY KEY, name varchar(255) NOT NULL, type varchar(16) NOT NULL, parent_id varchar(64), icon varchar(64) NOT NULL, color varchar(32) NOT NULL, sort_order integer NOT NULL DEFAULT 0)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS transactions (id varchar(64) PRIMARY KEY, owner_id varchar(64) NOT NULL, account_id varchar(64) NOT NULL, related_account_id varchar(64), project_id varchar(64), category_id varchar(64), type varchar(16) NOT NULL, amount_minor integer NOT NULL, currency varchar(8) NOT NULL, description text, occurred_at varchar(64) NOT NULL, created_at varchar(64) NOT NULL)`);
    await queryRunner.query(`INSERT OR IGNORE INTO categories (id,name,type,parent_id,icon,color,sort_order) VALUES ('income-salary','Зарплата','income',NULL,'briefcase','#2BB673',1),('income-side','Підробіток','income',NULL,'wallet','#B967CE',2),('income-gift','Подарунок','income',NULL,'gift','#E06C75',3),('expense-food','Їжа','expense',NULL,'utensils','#FF5B3D',1),('expense-home','Будинок','expense',NULL,'house','#E8B37A',2),('expense-transport','Транспорт','expense',NULL,'car','#FFD166',3)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_categories_type_order ON categories(type, sort_order)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_categories_type_order');
    await queryRunner.query('DROP TABLE IF EXISTS categories');
  }
}
