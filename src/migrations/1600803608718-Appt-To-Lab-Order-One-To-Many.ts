import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApptToLabOrderOneToMany1600803608718 implements MigrationInterface {
  name = 'ApptToLabOrderOneToMany1600803608718';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" DROP CONSTRAINT "FK_f11c7f4d6dc83cf3977a653197b"`,
      undefined,
    );
    await queryRunner.query(`DROP INDEX "IDX_f11c7f4d6dc83cf3977a653197"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" RENAME COLUMN "appointment_id" TO "lab_order_details_id"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" RENAME CONSTRAINT "PK_4241858023b1f704be581854ea9" TO "PK_9447c8019a398b342004a21b54c"`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_lab_order_details_lab_enum" AS ENUM('lab-corp', 'quest-diagnostics', 'lab-xpress')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_lab_order_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contact_name" character varying, "contact_phone" character varying, "lab" "app_lab_order_details_lab_enum", "is_get_from_doctor" boolean, "has_lab_order" boolean NOT NULL, "appointment_id" uuid NOT NULL, "abn_document_id" uuid, "accu_draw_id" uuid, "ordinal" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_49e9f2ca1da74dc77c1a0625f75" PRIMARY KEY ("id"))`,
      undefined,
    );

    await queryRunner.query(`INSERT INTO "app_lab_order_details"
                                                              ("contact_name",
                                                                "contact_phone",
                                                                "has_lab_order",
                                                                "is_get_from_doctor",
                                                                "lab",
                                                                "appointment_id",
                                                                "abn_document_id",
                                                                "accu_draw_id"
                                                              )
                                                                SELECT "lab_order_details_contact_name" AS "contact_name",
                                                                "lab_order_details_contact_phone" AS "contact_phone",
                                                                "lab_order_details_has_lab_order" AS "has_lab_order",
                                                                "lab_order_details_is_get_from_doctor" AS "is_get_from_doctor",
                                                                "lab_order_details_lab"::text::app_lab_order_details_lab_enum AS "lab",
                                                                "id" AS "appointment_id",
                                                                "abn_document_id",
                                                                "accu_draw_id"
                                                              FROM "app_appointment"
        `);

    // Need to also replace appointment_id with lab_order_details_id in app_appointment_lab_order_file_assoc
    await queryRunner.query(`UPDATE "app_appointment_lab_order_file_assoc" a SET "lab_order_details_id" = (
            SELECT "id" FROM "app_lab_order_details" b WHERE a.lab_order_details_id = b.appointment_id
        )`);

    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_contact_name"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_contact_phone"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_lab"`, undefined);
    await queryRunner.query(`DROP TYPE "public"."app_appointment_lab_order_details_lab_enum"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_is_get_from_doctor"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_details_has_lab_order"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_94affa25be33feba49dc20d321e"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_94950f1e84e479b86e868c464ee"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "abn_document_id"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "accu_draw_id"`, undefined);

    await queryRunner.query(
      `CREATE INDEX "IDX_7f145a9be0c17afaad7a12d1da" ON "app_appointment_lab_order_file_assoc" ("lab_order_details_id") `,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_lab_order_details" ADD CONSTRAINT "FK_0e018f7eae7293c1091a95609a7" FOREIGN KEY ("appointment_id") REFERENCES "app_appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_lab_order_details" ADD CONSTRAINT "FK_6e102cd0c32b6a46f7e665ddc41" FOREIGN KEY ("abn_document_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_lab_order_details" ADD CONSTRAINT "FK_0fbf2fda41a1c0c6c23509cfcd1" FOREIGN KEY ("accu_draw_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" ADD CONSTRAINT "FK_7f145a9be0c17afaad7a12d1da8" FOREIGN KEY ("lab_order_details_id") REFERENCES "app_lab_order_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" DROP CONSTRAINT "FK_7f145a9be0c17afaad7a12d1da8"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_lab_order_details" DROP CONSTRAINT "FK_0fbf2fda41a1c0c6c23509cfcd1"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_order_details" DROP CONSTRAINT "FK_6e102cd0c32b6a46f7e665ddc41"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_order_details" DROP CONSTRAINT "FK_0e018f7eae7293c1091a95609a7"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_7f145a9be0c17afaad7a12d1da"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD "lab_order_details_has_lab_order" boolean NOT NULL DEFAULT false`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_order_details_is_get_from_doctor" boolean`, undefined);
    await queryRunner.query(
      `CREATE TYPE "public"."app_appointment_lab_order_details_lab_enum" AS ENUM('lab-corp', 'lab-xpress', 'quest-diagnostics')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD "lab_order_details_lab" "app_appointment_lab_order_details_lab_enum"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_order_details_contact_phone" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_order_details_contact_name" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "accu_draw_id" uuid`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "abn_document_id" uuid`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_94950f1e84e479b86e868c464ee" FOREIGN KEY ("accu_draw_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_94affa25be33feba49dc20d321e" FOREIGN KEY ("abn_document_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );

    /* Update  */
    await queryRunner.query(
      `UPDATE "app_appointment" a SET
                                                  "lab_order_details_has_lab_order" = subQuery.has_lab_order,
                                                  "lab_order_details_is_get_from_doctor" = subQuery.is_get_from_doctor,
                                                  "lab_order_details_lab" = subQuery.lab::text::app_appointment_lab_order_details_lab_enum,
                                                  "lab_order_details_contact_phone" = subQuery.contact_phone,
                                                  "lab_order_details_contact_name" = subQuery.contact_name,
                                                  "accu_draw_id" = subQuery.accu_draw_id,
                                                  "abn_document_id" = subQuery.abn_document_id
                                                FROM
                                                  (SELECT * FROM "app_lab_order_details") AS subQuery
                                                WHERE
                                                  a.id = subQuery.appointment_id`,
      undefined,
    );

    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" RENAME CONSTRAINT "PK_9447c8019a398b342004a21b54c" TO "PK_4241858023b1f704be581854ea9"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" RENAME COLUMN "lab_order_details_id" TO "appointment_id"`,
      undefined,
    );

    await queryRunner.query(
      `UPDATE "app_appointment_lab_order_file_assoc" labOrderFileAssoc SET
                                                        "appointment_id" = subQuery.appointment_id
                                                      FROM
                                                          (SELECT id, appointment_id FROM "app_lab_order_details") AS subQuery
                                                      WHERE
                                                          labOrderFileAssoc.appointment_id = subQuery.id`,
      undefined,
    );

    await queryRunner.query(`DROP TABLE "app_lab_order_details"`, undefined);
    await queryRunner.query(`DROP TYPE "app_lab_order_details_lab_enum"`, undefined);
    await queryRunner.query(
      `CREATE INDEX "IDX_f11c7f4d6dc83cf3977a653197" ON "app_appointment_lab_order_file_assoc" ("appointment_id") `,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" ADD CONSTRAINT "FK_f11c7f4d6dc83cf3977a653197b" FOREIGN KEY ("appointment_id") REFERENCES "app_appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      undefined,
    );
  }
}
