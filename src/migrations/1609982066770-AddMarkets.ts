import { forEachSeries } from 'p-iteration';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarkets1609982066770 implements MigrationInterface {
  name = 'AddMarkets1609982066770';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "app_market"
       (
         "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
         "name"       character varying NOT NULL,
         "code"       character varying NOT NULL,
         "price"      integer           NOT NULL,
         "is_active"  boolean           NOT NULL,
         "created_at" TIMESTAMP         NOT NULL DEFAULT now(),
         "updated_at" TIMESTAMP         NOT NULL DEFAULT now(),
         CONSTRAINT "UQ_370664030a27de29d1feb490b00" UNIQUE ("code"),
         CONSTRAINT "PK_a20c0e0d8cbbfd6b53ddcef3430" PRIMARY KEY ("id")
       )`,
    );

    const [phx]: { id: string }[] = await queryRunner.query(
      `INSERT INTO "app_market" (name, code, price, is_active)
       VALUES ('Phoenix, AZ', 'PHX', 3900, true)
       RETURNING "id"`,
    );

    await queryRunner.query(`
      CREATE TABLE "app_specialist_user_market"
      (
        "specialist_user_id" uuid NOT NULL,
        "market_id"          uuid NOT NULL,
        CONSTRAINT "PK_d80fc8f8f5fa56ec11825a1d053" PRIMARY KEY ("specialist_user_id", "market_id")
      );
    `);

    await queryRunner.query(`CREATE INDEX "IDX_626ada5185ac1d932a58af3242" ON "app_specialist_user_market" ("specialist_user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_66463f57b793294cb73fdd1c35" ON "app_specialist_user_market" ("market_id");`);

    await queryRunner.query(`ALTER TABLE "app_service_area" ADD "market_id" uuid`);
    await queryRunner.query(`ALTER TABLE "app_service_area" ADD "timezone" character varying`);
    await queryRunner.query(
      `ALTER TABLE "app_service_area" ADD CONSTRAINT "FK_6d6588826c3ff030c5fadf314f9" FOREIGN KEY ("market_id") REFERENCES "app_market" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "app_staff_user_market"
       (
         "staff_user_id" uuid NOT NULL,
         "market_id"     uuid NOT NULL,
         CONSTRAINT "PK_dcd575531c0309ec766ed840a5b" PRIMARY KEY ("staff_user_id", "market_id")
       )`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_6d3dc13df679cb79f23a4a1883" ON "app_staff_user_market" ("staff_user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_3af18bebc401a5b4e40fd4221a" ON "app_staff_user_market" ("market_id") `);

    await queryRunner.query(
      `ALTER TABLE "app_specialist_user_market" ADD CONSTRAINT "FK_626ada5185ac1d932a58af32421" FOREIGN KEY ("specialist_user_id") REFERENCES "app_specialist_user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_specialist_user_market" ADD CONSTRAINT "FK_66463f57b793294cb73fdd1c35c" FOREIGN KEY ("market_id") REFERENCES "app_market" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "app_staff_user_market" ADD CONSTRAINT "FK_6d3dc13df679cb79f23a4a1883d" FOREIGN KEY ("staff_user_id") REFERENCES "app_staff_user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_staff_user_market" ADD CONSTRAINT "FK_3af18bebc401a5b4e40fd4221aa" FOREIGN KEY ("market_id") REFERENCES "app_market" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`UPDATE "app_service_area" SET "market_id" = $1`, [phx.id]);
    await queryRunner.query(`ALTER TABLE "app_service_area" ALTER COLUMN "market_id" SET NOT NULL`, undefined);

    await queryRunner.query(`UPDATE "app_service_area" SET "timezone" = $1`, ['America/Phoenix']);
    await queryRunner.query(`ALTER TABLE "app_service_area" ALTER COLUMN "timezone" SET NOT NULL`, undefined);

    const staff: { id: string }[] = await queryRunner.query('SELECT id FROM "app_staff_user"');

    await forEachSeries(staff, async (user) => {
      await queryRunner.query(
        `INSERT INTO "app_staff_user_market" (staff_user_id, market_id)
         VALUES ($1, $2)`,
        [user.id, phx.id],
      );
    });

    const specialists: { id: string }[] = await queryRunner.query('SELECT id FROM "app_specialist_user"');

    await forEachSeries(specialists, async (user) => {
      await queryRunner.query(
        `INSERT INTO "app_specialist_user_market" (specialist_user_id, market_id)
         VALUES ($1, $2)`,
        [user.id, phx.id],
      );
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_staff_user_market" DROP CONSTRAINT "FK_3af18bebc401a5b4e40fd4221aa"`);
    await queryRunner.query(`ALTER TABLE "app_staff_user_market" DROP CONSTRAINT "FK_6d3dc13df679cb79f23a4a1883d"`);
    await queryRunner.query(`ALTER TABLE "app_specialist_user_market" DROP CONSTRAINT "FK_66463f57b793294cb73fdd1c35c"`);
    await queryRunner.query(`ALTER TABLE "app_specialist_user_market" DROP CONSTRAINT "FK_626ada5185ac1d932a58af32421"`);
    await queryRunner.query(`ALTER TABLE "app_service_area" DROP CONSTRAINT "FK_6d6588826c3ff030c5fadf314f9"`);
    await queryRunner.query(`ALTER TABLE "app_service_area" DROP COLUMN "market_id"`);
    await queryRunner.query(`DROP INDEX "IDX_3af18bebc401a5b4e40fd4221a"`);
    await queryRunner.query(`DROP INDEX "IDX_6d3dc13df679cb79f23a4a1883"`);
    await queryRunner.query(`DROP TABLE "app_staff_user_market"`);
    await queryRunner.query(`DROP TABLE "app_specialist_user_market"`);
    await queryRunner.query(`DROP TABLE "app_market"`);
  }
}
