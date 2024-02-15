import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetSpecialistSchedules1573629512258 implements MigrationInterface {
  name = 'ResetSpecialistSchedules1573629512258';

  public async up(queryRunner: QueryRunner): Promise<any> {
    // Blow away specialist schedules in the database, since the formats are not compatible when we went IC->EE
    // Normally, we would have to update the Timekit resource too, but we aren't in production yet
    await queryRunner.query(`UPDATE "app_specialist_user" SET schedule = NULL`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
