import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabcorpCoupon1593410211913 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `INSERT INTO "app_coupon" (code, discount, discount_type, is_active, valid_from, valid_to, conditions) VALUES (
                'LABCORP', 2000, 'absolute'::app_coupon_discount_type_enum, TRUE, null, null, ARRAY['first-visit-only']::app_coupon_conditions_enum[])`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
