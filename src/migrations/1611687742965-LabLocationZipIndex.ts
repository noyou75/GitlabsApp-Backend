import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabLocationZipIndex1611687742965 implements MigrationInterface {
  name = 'LabLocationZipIndex1611687742965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_1dfa4e1300f250c080cb69fc28" ON "app_lab_location" ("address_zip_code") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_1dfa4e1300f250c080cb69fc28"`);
  }
}
