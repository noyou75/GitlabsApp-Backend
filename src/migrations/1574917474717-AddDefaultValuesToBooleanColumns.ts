import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultValuesToBooleanColumns1574917474717 implements MigrationInterface {
  name = 'AddDefaultValuesToBooleanColumns1574917474717';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "requires_fasting" SET DEFAULT false`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "verified_with_patient" SET DEFAULT false`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "verified_with_specialist" SET DEFAULT false`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "verified_with_specialist" DROP DEFAULT`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "verified_with_patient" DROP DEFAULT`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "requires_fasting" DROP DEFAULT`, undefined);
  }
}
