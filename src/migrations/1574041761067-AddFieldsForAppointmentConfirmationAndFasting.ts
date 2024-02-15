import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldsForAppointmentConfirmationAndFasting1574041761067 implements MigrationInterface {
  name = 'AddFieldsForAppointmentConfirmationAndFasting1574041761067';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "requires_fasting" boolean`, undefined);
    await queryRunner.query(`UPDATE "app_appointment" SET "requires_fasting" = FALSE WHERE "requires_fasting" IS NULL`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "requires_fasting" SET NOT NULL`, undefined);

    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "verified_with_patient" boolean`, undefined);
    await queryRunner.query(
      `UPDATE "app_appointment" SET "verified_with_patient" = FALSE WHERE "verified_with_patient" IS NULL`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "verified_with_patient" SET NOT NULL`, undefined);

    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "verified_with_specialist" boolean`, undefined);
    await queryRunner.query(
      `UPDATE "app_appointment" SET "verified_with_specialist" = FALSE WHERE "verified_with_specialist" IS NULL`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "verified_with_specialist" SET NOT NULL`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "verified_with_specialist"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "verified_with_patient"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "requires_fasting"`, undefined);
  }
}
