import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTimekitFields1613609686097 implements MigrationInterface {
  name = 'DropTimekitFields1613609686097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "timekit_resource_id"`);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "timekit_booking_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "timekit_booking_id" character varying`);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "timekit_resource_id" character varying`);
  }
}
