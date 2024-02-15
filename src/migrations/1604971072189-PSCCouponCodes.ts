import { forEachSeries } from 'p-iteration';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { difference } from 'lodash';

const codes = difference(
  Array.from(Array(23), (_, x) => `HOME${x + 1}`),
  ['HOME13'],
);

export class PSCCouponCodes1604971072189 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await forEachSeries(codes, async code => {
      await queryRunner.query(
        `INSERT INTO "app_coupon" (code, discount, discount_type, is_active, valid_from, valid_to, conditions, coupon_type) VALUES (
                '${code}', 15, 'percentage'::app_coupon_discount_type_enum, TRUE, null, null, ARRAY['first-visit-only']::app_coupon_conditions_enum[], 'General'::app_coupon_coupon_type_enum)`,
        undefined,
      );
    });
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await forEachSeries(codes, async code => {
      await queryRunner.query(`DELETE FROM "app_coupon" WHERE code = '${code}'`, undefined);
    });
  }
}
