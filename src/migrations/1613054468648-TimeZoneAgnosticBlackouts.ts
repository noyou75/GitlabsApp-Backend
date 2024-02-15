import { plainToClass } from 'class-transformer';
import { format, formatISO, parseISO } from 'date-fns';
import { MigrationInterface, QueryRunner } from "typeorm";
import { SimpleDateTime } from '../entities/embed/simple-date-time.embed';

interface Schedule<T> {
  blackouts: {
    start: T;
    end: T;
  }[];
}

interface EntityBySchedule<T> {
  id: string;
  schedule: Schedule<T>
}

export class TimeZoneAgnosticBlackouts1613054468648 implements MigrationInterface {
    name = 'TimeZoneAgnosticBlackouts1613054468648';

    public async up(queryRunner: QueryRunner): Promise<void> {
      /* Retrieve all specialist schedules that contain blackouts */
      const specialistsBySchedule: EntityBySchedule<string>[] =
        await queryRunner.query(`SELECT id, schedule FROM app_specialist_user WHERE schedule -> 'blackouts' IS NOT NULL`);

      for (let specialistBySchedule of specialistsBySchedule) {
        /* For each specialist, migrate the corresponding data over to the new format */
        const newSchedule = this._convertSchedule(specialistBySchedule.schedule);

        /* Push the new format back into the DB table */
        await queryRunner.query('UPDATE app_specialist_user SET schedule = $1 WHERE id = $2', [
          JSON.stringify(newSchedule),
          specialistBySchedule.id,
        ])
      }

      /* Retrieve all market schedules that have blackouts */
      const marketsBySchedule: EntityBySchedule<string>[] =
        await queryRunner.query(`SELECT id, schedule FROM app_market WHERE schedule -> 'blackouts' IS NOT NULL`);

      for (let marketBySchedule of marketsBySchedule) {
        /* For each market, migrate the corresponding data over to the new format */
        const newSchedule = this._convertSchedule(marketBySchedule.schedule);

        /* Push the new format back into the DB table */
        await queryRunner.query('UPDATE app_market SET schedule = $1 WHERE id = $2', [
          JSON.stringify(newSchedule),
          marketBySchedule.id,
        ])
      }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      /* Retrieve specialist IDs / schedule embeds */
      const specialistsBySchedule: EntityBySchedule<{
        date: string;
        time: string;
      }>[] = await queryRunner.query(`SELECT id, schedule FROM app_specialist_user WHERE schedule -> 'blackouts' IS NOT NULL`);

      for (const specialistBySchedule of specialistsBySchedule) {
        /* Revert the schedule and set to the DB */
        const revertedSchedule = this._revertSchedule(specialistBySchedule.schedule);
        await queryRunner.query(`UPDATE app_specialist_user SET schedule = $1 WHERE id = $2`, [
          JSON.stringify(revertedSchedule),
          specialistBySchedule.id,
        ]);
      }

      /* Retrieve market IDs / schedule embeds */
      const marketsBySchedule: EntityBySchedule<{
        date: string;
        time: string;
      }>[] = await queryRunner.query(`SELECT id, schedule FROM app_market WHERE schedule -> 'blackouts' IS NOT NULL`);

      for (const marketBySchedule of marketsBySchedule) {
        /* Revert the schedule and set to the DB */
        const revertedSchedule = this._revertSchedule(marketBySchedule.schedule);
        await queryRunner.query(`UPDATE app_market SET schedule = $1 WHERE id = $2`, [
          JSON.stringify(revertedSchedule),
          marketBySchedule.id,
        ])
      }

    }

    private _convertSchedule(premigrationSchedule: Schedule<string>): Schedule<{ date: string, time: string }> {
      return {
        ...premigrationSchedule,
        blackouts: premigrationSchedule.blackouts.map(blackout => {
          const start = blackout.start && parseISO(blackout.start);
          const end = blackout.end && parseISO(blackout.end);

          return {
            start: start && {
              date: format(start, 'yyyy-MM-dd'),
              time: format(start, 'HH:mm'),
            },
            end: end && {
              date: format(end, 'yyyy-MM-dd'),
              time: format(end, 'HH:mm'),
            }
          }
        }),
      }
    }

    private _revertSchedule(postmigrationSchedule: Schedule<{ date: string, time: string }>): Schedule<string> {
      return {
        ...postmigrationSchedule,
        blackouts: postmigrationSchedule.blackouts.map(blackout => ({
          start: blackout.start && formatISO(plainToClass(SimpleDateTime, blackout.start).toDate()),
          end: blackout.end && formatISO(plainToClass(SimpleDateTime, blackout.end).toDate()),
        }))
      }
    }
}
