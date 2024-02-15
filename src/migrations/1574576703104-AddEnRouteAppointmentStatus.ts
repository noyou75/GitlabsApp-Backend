import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnRouteAppointmentStatus1574576703104 implements MigrationInterface {
  name = 'AddEnRouteAppointmentStatus1574576703104';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TYPE "public"."app_appointment_status_enum" RENAME TO "app_appointment_status_enum_old"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_enum" AS ENUM('pending', 'confirmed', 'en-route', 'in-progress', 'collected', 'delivered', 'cancelled')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "status" TYPE "app_appointment_status_enum" USING "status"::"text"::"app_appointment_status_enum"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_appointment_status_enum_old"`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_enum_old" AS ENUM('cancelled', 'pending', 'confirmed', 'in-progress', 'collected', 'delivered')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "status" TYPE "app_appointment_status_enum_old" USING "status"::"text"::"app_appointment_status_enum_old"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_appointment_status_enum"`, undefined);
    await queryRunner.query(`ALTER TYPE "app_appointment_status_enum_old" RENAME TO  "app_appointment_status_enum"`, undefined);
  }
}
