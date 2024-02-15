import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptionalServiceAreaColumns1573024498226 implements MigrationInterface {
  name = 'OptionalServiceAreaColumns1573024498226';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_service_area" ALTER COLUMN "city" DROP NOT NULL`, undefined);
    await queryRunner.query(`ALTER TABLE "app_service_area" ALTER COLUMN "county" DROP NOT NULL`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_service_area" ALTER COLUMN "county" SET NOT NULL`, undefined);
    await queryRunner.query(`ALTER TABLE "app_service_area" ALTER COLUMN "city" SET NOT NULL`, undefined);
  }
}
