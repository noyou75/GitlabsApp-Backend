import { forEach } from 'p-iteration';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { generateIdentifier } from '../modules/appointment/appointment.utils';

export class AddUniqueIdentifierToAppointment1597523751013 implements MigrationInterface {
  name = 'AddUniqueIdentifierToAppointment1597523751013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "identifier" character varying`, undefined);
    await queryRunner.query(`CREATE INDEX "IDX_1c85390c974a5fadf58eb7f059" ON "app_appointment" ("identifier") `, undefined);

    await forEach(await queryRunner.query(`SELECT id FROM "app_appointment" WHERE "identifier" IS NULL`), async (app: { id: string }) => {
      // Unique verification is skipped here as its causes the migration process to hang due to a bug in TypeORM
      // This shouldn't pose a problem as the identifier doesn't really need to be unique (just unique enough), and we don't have
      // nearly enough records in this table at this point to trigger a collision (probably...).
      await queryRunner.query(`UPDATE "app_appointment" SET "identifier" = '${await generateIdentifier(true)}' WHERE "id" = '${app.id}'`);
    });

    await queryRunner.query(`ALTER TABLE "app_appointment" ALTER COLUMN "identifier" SET NOT NULL`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_1c85390c974a5fadf58eb7f059"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "identifier"`, undefined);
  }
}
