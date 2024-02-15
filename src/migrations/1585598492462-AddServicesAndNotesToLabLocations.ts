import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicesAndNotesToLabLocations1585598492462 implements MigrationInterface {
  name = 'AddServicesAndNotesToLabLocations1585598492462';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_location" ADD "services" jsonb`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_location" ADD "notes" jsonb`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP COLUMN "notes"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP COLUMN "services"`, undefined);
  }
}
