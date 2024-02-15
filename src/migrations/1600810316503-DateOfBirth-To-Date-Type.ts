import { MigrationInterface, QueryRunner } from 'typeorm';

export class DateOfBirthToDateType1600810316503 implements MigrationInterface {
  name = 'DateOfBirthToDateType1600810316503';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "dob_new" date`);
    await queryRunner.query(`UPDATE "app_patient_user" SET "dob_new" = DATE(dob) WHERE dob IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" RENAME COLUMN "dob_new" TO "dob"`);

    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "dob_new" date`);
    await queryRunner.query(`UPDATE "app_specialist_user" SET "dob_new" = DATE(dob) WHERE dob IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" RENAME COLUMN "dob_new" TO "dob"`);

    await queryRunner.query(`ALTER TABLE "app_staff_user" ADD "dob_new" date`);
    await queryRunner.query(`UPDATE "app_staff_user" SET "dob_new" = DATE(dob) WHERE dob IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "app_staff_user" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "app_staff_user" RENAME COLUMN "dob_new" TO "dob"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "dob_new" date`);
    await queryRunner.query(`UPDATE "app_patient_user" SET "dob_new" = dob::timestamp WHERE dob IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" RENAME COLUMN "dob_new" TO "dob"`);

    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "dob_new" date`);
    await queryRunner.query(`UPDATE "app_specialist_user" SET "dob_new" = dob::timestamp WHERE dob IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" RENAME COLUMN "dob_new" TO "dob"`);

    await queryRunner.query(`ALTER TABLE "app_staff_user" ADD "dob_new" date`);
    await queryRunner.query(`UPDATE "app_staff_user" SET "dob_new" = dob::timestamp WHERE dob IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "app_staff_user" DROP COLUMN "dob"`);
    await queryRunner.query(`ALTER TABLE "app_staff_user" RENAME COLUMN "dob_new" TO "dob"`);
  }
}
