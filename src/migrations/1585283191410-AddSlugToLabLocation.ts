import { plainToClass } from 'class-transformer';
import { forEach } from 'p-iteration';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { LabLocationEntity } from '../entities/lab-location.entity';

export class AddSlugToLabLocation1585283191410 implements MigrationInterface {
  name = 'AddSlugToLabLocation1585283191410';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_location" ADD "slug" character varying`, undefined);

    // Update slugs for all LabLocation entities
    await forEach(await queryRunner.query(`SELECT * FROM "app_lab_location" WHERE "slug" IS NULL`), async data => {
      const lab = plainToClass(LabLocationEntity, data);
      lab.setSlug();
      await queryRunner.query(`UPDATE "app_lab_location" SET "slug" = '${lab.slug}' WHERE "id" = '${lab.id}'`);
    });

    await queryRunner.query(`ALTER TABLE "app_lab_location" ALTER COLUMN "slug" SET NOT NULL`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_location" ADD CONSTRAINT "UQ_1a7013c73c589bfa9e93c5de3a2" UNIQUE ("slug")`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP CONSTRAINT "UQ_1a7013c73c589bfa9e93c5de3a2"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP COLUMN "slug"`, undefined);
  }
}
