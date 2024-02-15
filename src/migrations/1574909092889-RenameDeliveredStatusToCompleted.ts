import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDeliveredStatusToCompleted1574909092889 implements MigrationInterface {
  name = 'RenameDeliveredStatusToCompleted1574909092889';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TYPE "public"."app_appointment_status_enum" RENAME TO "app_appointment_status_enum_old"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_enum_temp" AS ENUM('pending', 'confirmed', 'en-route', 'in-progress', 'collected', 'delivered', 'completed', 'cancelled')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "status" TYPE "app_appointment_status_enum_temp" USING "status"::"text"::"app_appointment_status_enum_temp"`,
      undefined,
    );

    await queryRunner.query(`UPDATE "app_appointment" SET "status" = 'completed' WHERE "status" = 'delivered'`);

    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_enum" AS ENUM('pending', 'confirmed', 'en-route', 'in-progress', 'collected', 'completed', 'cancelled')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "status" TYPE "app_appointment_status_enum" USING "status"::"text"::"app_appointment_status_enum"`,
      undefined,
    );

    await queryRunner.query(`DROP TYPE "app_appointment_status_enum_old"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_status_enum_temp"`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_enum_old" AS ENUM('pending', 'confirmed', 'en-route', 'in-progress', 'collected', 'delivered', 'cancelled')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_enum_temp" AS ENUM('pending', 'confirmed', 'en-route', 'in-progress', 'collected', 'delivered', 'completed', 'cancelled')`,
      undefined,
    );

    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "status" TYPE "app_appointment_status_enum_temp" USING "status"::"text"::"app_appointment_status_enum_temp"`,
      undefined,
    );

    await queryRunner.query(`UPDATE "app_appointment" SET "status" = 'delivered' WHERE "status" = 'completed'`);

    await queryRunner.query(
      `ALTER TABLE "app_appointment" ALTER COLUMN "status" TYPE "app_appointment_status_enum_old" USING "status"::"text"::"app_appointment_status_enum_old"`,
      undefined,
    );

    await queryRunner.query(`DROP TYPE "app_appointment_status_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_status_enum_temp"`, undefined);
    await queryRunner.query(`ALTER TYPE "app_appointment_status_enum_old" RENAME TO  "app_appointment_status_enum"`, undefined);
  }
}
