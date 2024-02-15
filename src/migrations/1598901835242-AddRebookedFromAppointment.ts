import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRebookedFromAppointment1598901835242 implements MigrationInterface {
  name = 'AddRebookedFromAppointment1598901835242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "rebooked_from_id" uuid`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "UQ_8a7cc61d69e7b0442b935d92ac8" UNIQUE ("rebooked_from_id")`,
      undefined,
    );

    await queryRunner.query(`ALTER TYPE "public"."app_coupon_type_enum" RENAME TO "app_coupon_coupon_type_enum_old"`, undefined);
    await queryRunner.query(`CREATE TYPE "app_coupon_coupon_type_enum" AS ENUM('OptIn', 'General')`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_coupon" ALTER COLUMN "coupon_type" TYPE "app_coupon_coupon_type_enum" USING "coupon_type"::"text"::"app_coupon_coupon_type_enum"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_coupon_coupon_type_enum_old"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_8a7cc61d69e7b0442b935d92ac8" FOREIGN KEY ("rebooked_from_id") REFERENCES "app_appointment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_8a7cc61d69e7b0442b935d92ac8"`, undefined);
    await queryRunner.query(`CREATE TYPE "app_coupon_coupon_type_enum_old" AS ENUM()`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_coupon" ALTER COLUMN "coupon_type" TYPE "app_coupon_coupon_type_enum_old" USING "coupon_type"::"text"::"app_coupon_coupon_type_enum_old"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_coupon_coupon_type_enum"`, undefined);
    await queryRunner.query(`ALTER TYPE "app_coupon_coupon_type_enum_old" RENAME TO  "app_coupon_type_enum"`, undefined);

    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "UQ_8a7cc61d69e7b0442b935d92ac8"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "rebooked_from_id"`, undefined);
  }
}
