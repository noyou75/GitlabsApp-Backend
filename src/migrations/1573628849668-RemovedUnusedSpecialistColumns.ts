import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovedUnusedSpecialistColumns1573628849668 implements MigrationInterface {
  name = 'RemovedUnusedSpecialistColumns1573628849668';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP INDEX "IDX_1eda8a13484ab72817e42e1540"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "ssn_last4"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "details_why"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "details_experience"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "details_year_started"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "details_education"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "details_about"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "payout_profile_external_id"`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "payout_profile_external_id" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "details_about" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "details_education" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "details_year_started" integer`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "details_experience" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "details_why" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "ssn_last4" integer`, undefined);
    await queryRunner.query(
      `CREATE INDEX "IDX_1eda8a13484ab72817e42e1540" ON "app_specialist_user" ("payout_profile_external_id") `,
      undefined,
    );
  }
}
