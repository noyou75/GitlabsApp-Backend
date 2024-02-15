import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixConstraintIdentifier1574897432730 implements MigrationInterface {
  name = 'FixConstraintIdentifier1574897432730';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_b0520b4a1f6958d01d941729352"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_b8021fe67f5f18917f0e472cf8e" FOREIGN KEY ("lab_order_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_b8021fe67f5f18917f0e472cf8e"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_b0520b4a1f6958d01d941729352" FOREIGN KEY ("lab_order_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }
}
