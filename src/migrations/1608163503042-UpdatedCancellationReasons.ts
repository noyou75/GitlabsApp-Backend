import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatedCancellationReasons1608163503042 implements MigrationInterface {
  name = 'UpdatedCancellationReasons1608163503042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."app_appointment_cancel_reason_enum" RENAME TO "app_appointment_cancel_reason_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_cancel_reason_enum" AS ENUM('no-answer', 'no-confirm', 'patient-requested', 'patient-self-requested', 'patient-incorrect-info', 'patient-booked-inlab-appointment', 'patient-underage', 'patient-failed-to-fast', 'lab-order-unclear', 'specialist-insufficient-supplies', 'specialist-unavailable', 'specialist-no-show', 'logistics-issue', 'ops-insufficient-supplies', 'unsupported-test', 'no-lab-order', 'rebooked', 'duplicate', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "cancel_reason" TYPE "app_appointment_cancel_reason_enum" USING "cancel_reason"::"text"::"app_appointment_cancel_reason_enum"`,
    );
    await queryRunner.query(`DROP TYPE "app_appointment_cancel_reason_enum_old"`);
    await queryRunner.query(`COMMENT ON COLUMN "app_appointment"."cancel_reason" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "app_appointment"."cancel_reason" IS NULL`);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_cancel_reason_enum_old" AS ENUM('no-answer', 'no-confirm', 'patient-requested', 'patient-failed-to-fast', 'lab-order-unclear', 'specialist-insufficient-supplies', 'specialist-unavailable', 'specialist-no-show', 'logistics-issue', 'ops-insufficient-supplies', 'no-lab-order', 'rebooked', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "cancel_reason" TYPE "app_appointment_cancel_reason_enum_old" USING "cancel_reason"::"text"::"app_appointment_cancel_reason_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "app_appointment_cancel_reason_enum"`);
    await queryRunner.query(`ALTER TYPE "app_appointment_cancel_reason_enum_old" RENAME TO  "app_appointment_cancel_reason_enum"`);
  }
}
