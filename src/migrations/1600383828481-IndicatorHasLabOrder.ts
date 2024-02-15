import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndicatorHasLabOrder1600383828481 implements MigrationInterface {
  name = 'IndicatorHasLabOrder1600383828481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD "lab_order_details_has_lab_order" boolean NOT NULL DEFAULT false`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_has_lab_order"`, undefined);
  }
}
