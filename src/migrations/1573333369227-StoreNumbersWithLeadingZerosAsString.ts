import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreNumbersWithLeadingZerosAsString1573333369227 implements MigrationInterface {
  name = 'StoreNumbersWithLeadingZerosAsString1573333369227';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" ALTER COLUMN "payment_profile_last4" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" ALTER COLUMN "payment_profile_exp_month" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" ALTER COLUMN "payment_profile_exp_year" TYPE character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" ALTER COLUMN "payment_profile_last4" TYPE integer`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" ALTER COLUMN "payment_profile_exp_month" TYPE integer`);
    await queryRunner.query(`ALTER TABLE "app_patient_user" ALTER COLUMN "payment_profile_exp_year" TYPE integer`);
  }
}
