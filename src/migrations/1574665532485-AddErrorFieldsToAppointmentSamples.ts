import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddErrorFieldsToAppointmentSamples1574665532485 implements MigrationInterface {
  name = 'AddErrorFieldsToAppointmentSamples1574665532485';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TYPE "app_appointment_sample_uncollected_reason_enum" AS ENUM('patient-health-issue', 'weak-blood-flow', 'flat-tube', 'consent-withdrawn', 'hematoma-formed', 'missed-vein', 'other')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_sample" ADD "uncollected_reason" "app_appointment_sample_uncollected_reason_enum"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment_sample" ADD "uncollected_note" character varying`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_sample_unprocessed_reason_enum" AS ENUM('specimen-clotted', 'specimen-hemolyzed', 'insufficient-quantity', 'incorrect-tube', 'labelling-error', 'misplaced-sample', 'other')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_sample" ADD "unprocessed_reason" "app_appointment_sample_unprocessed_reason_enum"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment_sample" ADD "unprocessed_note" character varying`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment_sample" DROP COLUMN "unprocessed_note"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment_sample" DROP COLUMN "unprocessed_reason"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_sample_unprocessed_reason_enum"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment_sample" DROP COLUMN "uncollected_note"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment_sample" DROP COLUMN "uncollected_reason"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_sample_uncollected_reason_enum"`, undefined);
  }
}
