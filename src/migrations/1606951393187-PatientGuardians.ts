import { MigrationInterface, QueryRunner } from 'typeorm';

export class PatientGuardians1606951393187 implements MigrationInterface {
  name = 'PatientGuardians1606951393187';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "guardian_name" character varying`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "guardian_relationship" character varying`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "guardian_confirmation_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "guardian_confirmation_at"`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "guardian_relationship"`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "guardian_name"`);
  }
}
