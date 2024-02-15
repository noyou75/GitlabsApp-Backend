import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptionalSpecialistOnAppointment1607732689917 implements MigrationInterface {
  name = 'OptionalSpecialistOnAppointment1607732689917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_1e9529c1e05274536b6c38d35e5"`);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "specialist_id" DROP NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "app_appointment"."specialist_id" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_1e9529c1e05274536b6c38d35e5" FOREIGN KEY ("specialist_id") REFERENCES "app_specialist_user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "timekit_booking_id" DROP NOT NULL;`);
    await queryRunner.query(`COMMENT ON COLUMN "app_appointment"."timekit_booking_id" IS NULL;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "timekit_booking_id" SET NOT NULL;`);
    await queryRunner.query(`COMMENT ON COLUMN "app_appointment"."timekit_booking_id" IS NULL;`);

    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_1e9529c1e05274536b6c38d35e5"`);
    await queryRunner.query(`COMMENT ON COLUMN "app_appointment"."specialist_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "specialist_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_1e9529c1e05274536b6c38d35e5" FOREIGN KEY ("specialist_id") REFERENCES "app_specialist_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
