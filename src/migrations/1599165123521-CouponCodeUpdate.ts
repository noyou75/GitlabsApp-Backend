import { forEachSeries } from 'p-iteration';
import { MigrationInterface, QueryRunner } from 'typeorm';

const newCodes = ['VALPAK15', 'SLM15', 'SSS15', 'SHARE15', 'GOOGLE15', 'YELP15', 'LC15'];
const oldCodes = ['VALPAK10', 'SLM10', 'SSS10', 'SHARE10', 'GOOGLE10', 'YELP10'];

export class CouponCodeUpdate1599165123521 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await forEachSeries(oldCodes, async code => {
      await queryRunner.query(`UPDATE "app_coupon" SET "is_active" = FALSE WHERE code = '${code}'`);
    });

    await forEachSeries(newCodes, async code => {
      await queryRunner.query(
        `INSERT INTO "app_coupon" (code, discount, discount_type, is_active, valid_from, valid_to, conditions, coupon_type) VALUES (
                '${code}', 15, 'percentage'::app_coupon_discount_type_enum, TRUE, null, null, ARRAY['first-visit-only']::app_coupon_conditions_enum[], 'General'::app_coupon_coupon_type_enum)`,
        undefined,
      );
    });

    await queryRunner.query(
      `INSERT INTO "app_coupon" (code, discount, discount_type, is_active, valid_from, valid_to, conditions, coupon_type) VALUES (
                'EXPANDING', 1000, 'absolute'::app_coupon_discount_type_enum, TRUE, null, null, ARRAY['first-visit-only']::app_coupon_conditions_enum[], 'General'::app_coupon_coupon_type_enum)`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DELETE FROM "app_coupon" WHERE code = 'EXPANDING'`, undefined);

    await forEachSeries(newCodes, async code => {
      await queryRunner.query(`DELETE FROM "app_coupon" WHERE code = '${code}'`, undefined);
    });

    await forEachSeries(oldCodes, async code => {
      await queryRunner.query(`UPDATE "app_coupon" SET "is_active" = TRUE WHERE code = '${code}'`);
    });
  }
}
