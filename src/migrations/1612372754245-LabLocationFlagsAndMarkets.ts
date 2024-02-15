import { MigrationInterface, QueryRunner } from 'typeorm';
import { forEachSeries } from 'p-iteration';

export class LabLocationFlagsAndMarkets1612372754245 implements MigrationInterface {
  name = 'LabLocationFlagsAndMarkets1612372754245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "app_lab_location_market" ("lab_location_id" uuid NOT NULL, "market_id" uuid NOT NULL, CONSTRAINT "PK_f96292dab60a7e8b13461ac253d" PRIMARY KEY ("lab_location_id", "market_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_80accded1e6b1c0f57c92043c1" ON "app_lab_location_market" ("lab_location_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_a47b51675400a21b7bed138f4b" ON "app_lab_location_market" ("market_id") `);
    await queryRunner.query(`ALTER TABLE "app_lab_location" ADD "public" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "app_lab_location" ALTER COLUMN "active" SET DEFAULT true`);
    await queryRunner.query(
      `ALTER TABLE "app_lab_location_market" ADD CONSTRAINT "FK_80accded1e6b1c0f57c92043c1b" FOREIGN KEY ("lab_location_id") REFERENCES "app_lab_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_lab_location_market" ADD CONSTRAINT "FK_a47b51675400a21b7bed138f4bd" FOREIGN KEY ("market_id") REFERENCES "app_market"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    const labs: { id: string }[] = await queryRunner.query('SELECT id FROM "app_lab_location" where address_state=\'AZ\'');
    const [phx] = await queryRunner.query('SELECT id FROM "app_market" where code = \'PHX\'');

    if (phx) {
      await forEachSeries(labs, async (lab) => {
        await queryRunner.query(
          `INSERT INTO "app_lab_location_market" (lab_location_id, market_id)
         VALUES ($1, $2)`,
          [lab.id, phx.id],
        );
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_lab_location_market" DROP CONSTRAINT "FK_a47b51675400a21b7bed138f4bd"`);
    await queryRunner.query(`ALTER TABLE "app_lab_location_market" DROP CONSTRAINT "FK_80accded1e6b1c0f57c92043c1b"`);
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP COLUMN "public"`);
    await queryRunner.query(`ALTER TABLE "app_lab_location" ALTER COLUMN "active" DROP DEFAULT`);
    await queryRunner.query(`DROP INDEX "IDX_a47b51675400a21b7bed138f4b"`);
    await queryRunner.query(`DROP INDEX "IDX_80accded1e6b1c0f57c92043c1"`);
    await queryRunner.query(`DROP TABLE "app_lab_location_market"`);
  }
}
