import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabIntegrity1577466975782 implements MigrationInterface {
  name = 'LabIntegrity1577466975782';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" RENAME COLUMN "lab_order_id" TO "lab_order_file_id"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_order_details_contact_name" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_order_details_contact_phone" character varying`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_lab_order_details_lab_enum" AS ENUM('lab-corp', 'quest-diagnostics', 'lab-xpress')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD "lab_order_details_lab" "app_appointment_lab_order_details_lab_enum"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_order_details_is_get_from_doctor" boolean`, undefined);

    // Cancel reason update
    await queryRunner.query(
      `ALTER TYPE "public"."app_appointment_cancel_reason_enum" RENAME TO "app_appointment_cancel_reason_enum_old"`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_appointment_cancel_reason_enum" AS ENUM('no-answer', 'no-confirm', 'patient-requested', 'patient-failed-to-fast', 'lab-order-unclear', 'specialist-insufficient-supplies', 'specialist-unavailable', 'specialist-no-show', 'logistics-issue', 'ops-insufficient-supplies', 'no-lab-order', 'rebooked', 'other')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "cancel_reason" TYPE "app_appointment_cancel_reason_enum" USING "cancel_reason"::"text"::"app_appointment_cancel_reason_enum"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_appointment_cancel_reason_enum_old"`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" RENAME COLUMN "lab_order_file_id" TO "lab_order_id"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_is_get_from_doctor"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_lab"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_lab_order_details_lab_enum"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_contact_phone"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_contact_name"`, undefined);

    // Cancel reason update
    await queryRunner.query(
      `CREATE TYPE "app_appointment_cancel_reason_enum_old" AS ENUM('lab-order-unclear', 'logistics-issue', 'no-answer', 'no-confirm', 'ops-insufficient-supplies', 'other', 'patient-failed-to-fast', 'patient-requested', 'rebooked', 'specialist-insufficient-supplies', 'specialist-no-show', 'specialist-unavailable')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "cancel_reason" TYPE "app_appointment_cancel_reason_enum_old" USING "cancel_reason"::"text"::"app_appointment_cancel_reason_enum_old"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_appointment_cancel_reason_enum"`, undefined);
    await queryRunner.query(
      `ALTER TYPE "app_appointment_cancel_reason_enum_old" RENAME TO  "app_appointment_cancel_reason_enum"`,
      undefined,
    );
  }
}
