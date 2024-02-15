import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropServiceAreaFKFromLabLocation1585263550680 implements MigrationInterface {
  name = 'DropServiceAreaFKFromLabLocation1585263550680';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP CONSTRAINT "FK_9f91ad92d6156c5fd7147f70d5f"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP COLUMN "address_service_area_id"`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_location" ADD "address_service_area_id" uuid`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_lab_location" ADD CONSTRAINT "FK_9f91ad92d6156c5fd7147f70d5f" FOREIGN KEY ("address_service_area_id") REFERENCES "app_service_area"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }
}
