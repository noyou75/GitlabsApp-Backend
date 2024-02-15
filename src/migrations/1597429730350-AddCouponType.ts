import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponType1597429730350 implements MigrationInterface {
  name = 'AddCouponType1597429730350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "app_coupon_type_enum" AS ENUM('OptIn', 'General')`, undefined);
    await queryRunner.query(`ALTER TABLE "app_coupon" ADD "coupon_type" "app_coupon_type_enum"`, undefined);
    await queryRunner.query(`UPDATE "app_coupon" SET "coupon_type" = 'OptIn' WHERE code = 'FIRSTVISIT'`);
    await queryRunner.query(`UPDATE "app_coupon" SET "coupon_type" = 'General' WHERE code != 'FIRSTVISIT'`);
    await queryRunner.query(`ALTER TABLE "app_coupon" ALTER COLUMN "coupon_type" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_coupon" DROP COLUMN "coupon_type"`, undefined);
    await queryRunner.query(`DROP TYPE "app_coupon_type_enum"`, undefined);
  }
}
