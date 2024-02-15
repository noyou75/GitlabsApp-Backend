import { MigrationInterface, QueryRunner } from 'typeorm';

export class Coupons1592858200785 implements MigrationInterface {
  name = 'Coupons1592858200785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "app_coupon_discount_type_enum" AS ENUM('absolute', 'percentage')`, undefined);
    await queryRunner.query(`CREATE TYPE "app_coupon_conditions_enum" AS ENUM('first-visit-only')`, undefined);
    await queryRunner.query(
      `CREATE TABLE "app_coupon" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "discount" integer NOT NULL, "discount_type" "app_coupon_discount_type_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "valid_from" TIMESTAMP, "valid_to" TIMESTAMP, "conditions" "app_coupon_conditions_enum" array, CONSTRAINT "UQ_0d28280e008fd67d2f90cc20a17" UNIQUE ("code"), CONSTRAINT "PK_daca61f597c77acb7c66da7eaf8" PRIMARY KEY ("id"))`,
      undefined,
    );

    await queryRunner.query(
      `INSERT INTO "app_coupon" (code, discount, discount_type, is_active, valid_from, valid_to, conditions) VALUES (
                'FIRSTVISIT', 2000, 'absolute'::app_coupon_discount_type_enum, TRUE, null, null, ARRAY['first-visit-only']::app_coupon_conditions_enum[])`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_coupon"`, undefined);
    await queryRunner.query(`DROP TYPE "app_coupon_conditions_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_coupon_discount_type_enum"`, undefined);
  }
}
