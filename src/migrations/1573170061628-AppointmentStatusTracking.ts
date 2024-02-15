import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentStatusTracking1573170061628 implements MigrationInterface {
  name = 'AppointmentStatusTracking1573170061628';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_9cb0aff9896a355047239134357"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "status_id"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_enum" AS ENUM('cancelled', 'pending', 'confirmed', 'in-progress', 'collected', 'delivered')`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "status" "app_appointment_status_enum"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "status_date" TIMESTAMP`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "status_history" jsonb`, undefined);

    await queryRunner.query(
      `UPDATE "app_appointment" SET "status" = 'pending', "status_date" = "app_appointment".created_at WHERE "status" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "status_date" SET NOT NULL`);

    // Drop unused table
    await queryRunner.query(`DROP TABLE "app_appointment_status"`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "status_history"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "status_date"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "status"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_status_enum"`, undefined);

    // Note: Does not include recreating app_appointment_status table
  }
}
