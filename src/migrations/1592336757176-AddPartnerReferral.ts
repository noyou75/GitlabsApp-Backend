import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartnerReferral1592336757176 implements MigrationInterface {
  name = 'AddPartnerReferral1592336757176';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "partner_referral" jsonb`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "partner_referral"`, undefined);
  }
}
