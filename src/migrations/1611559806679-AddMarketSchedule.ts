import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketSchedule1611559806679 implements MigrationInterface {
  name = 'AddMarketSchedule1611559806679';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_market" ADD "schedule" jsonb`);

    const defaultSchedule = {
      monday: {
        disabled: false,
        hours: [{ start: '05:00', end: '14:00' }],
      },
      tuesday: {
        disabled: false,
        hours: [{ start: '05:00', end: '14:00' }],
      },
      wednesday: {
        disabled: false,
        hours: [{ start: '05:00', end: '14:00' }],
      },
      thursday: {
        disabled: false,
        hours: [{ start: '05:00', end: '14:00' }],
      },
      friday: {
        disabled: false,
        hours: [{ start: '05:00', end: '14:00' }],
      },
      saturday: {
        disabled: true,
        hours: [],
      },
      sunday: {
        disabled: true,
        hours: [],
      },
      blackouts: [],
    };

    await queryRunner.query(`UPDATE app_market SET schedule = $1`, [JSON.stringify(defaultSchedule)]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_market" DROP COLUMN "schedule"`);
  }
}
