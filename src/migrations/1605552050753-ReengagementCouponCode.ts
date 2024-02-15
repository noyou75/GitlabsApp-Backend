import { MigrationInterface, QueryRunner } from 'typeorm';

const code = 'ALLSET';

export class ReengagementCouponCode1605552050753 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `INSERT INTO "app_coupon" (code, discount, discount_type, is_active, valid_from, valid_to, conditions, coupon_type) VALUES (
                '${code}', 15, 'percentage'::app_coupon_discount_type_enum, TRUE, null, null, ARRAY['first-visit-only']::app_coupon_conditions_enum[], 'General'::app_coupon_coupon_type_enum)`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DELETE FROM "app_coupon" WHERE code = '${code}'`, undefined);
  }
}
