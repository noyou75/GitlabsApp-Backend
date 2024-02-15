import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabOrderDetailsDeletedIndicator1601649628073 implements MigrationInterface {
  name = 'LabOrderDetailsDeletedIndicator1601649628073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_order_details" ADD "is_deleted" boolean NOT NULL DEFAULT false`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_order_details" DROP COLUMN "is_deleted"`, undefined);
  }
}
