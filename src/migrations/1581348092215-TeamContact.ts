import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeamContact1581348092215 implements MigrationInterface {
  name = 'TeamContact1581348092215';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_staff_user" ADD "contact" boolean not null DEFAULT true`, undefined);
    await queryRunner.query(`UPDATE "app_staff_user" SET "contact" = false WHERE "phone_number" != '3056099191'`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_staff_user" DROP COLUMN "contact"`, undefined);
  }
}
