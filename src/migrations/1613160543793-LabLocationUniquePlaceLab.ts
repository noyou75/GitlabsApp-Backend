import {MigrationInterface, QueryRunner} from "typeorm";

export class LabLocationUniquePlaceLab1613160543793 implements MigrationInterface {
    name = 'LabLocationUniquePlaceLab1613160543793'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`COMMENT ON COLUMN "app_lab_location"."place_id" IS NULL`);
      await queryRunner.query(`ALTER TABLE "app_lab_location" DROP CONSTRAINT "UQ_fbcbb02693520eebb3ea09632bd"`);
      await queryRunner.query(`ALTER TABLE "app_lab_location" ALTER COLUMN "slug" DROP NOT NULL`);
      await queryRunner.query(`COMMENT ON COLUMN "app_lab_location"."slug" IS NULL`);
      await queryRunner.query(`ALTER TABLE "app_lab_location" ADD CONSTRAINT "UQ_04e283e7d4dca33752e254722ac" UNIQUE ("lab", "place_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_lab_location" DROP CONSTRAINT "UQ_04e283e7d4dca33752e254722ac"`);
        await queryRunner.query(`COMMENT ON COLUMN "app_lab_location"."slug" IS NULL`);
        await queryRunner.query(`ALTER TABLE "app_lab_location" ALTER COLUMN "slug" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "app_lab_location" ADD CONSTRAINT "UQ_fbcbb02693520eebb3ea09632bd" UNIQUE ("place_id")`);
        await queryRunner.query(`COMMENT ON COLUMN "app_lab_location"."place_id" IS NULL`);
    }

}
