import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultiLabOrder1582652177242 implements MigrationInterface {
  name = 'MultiLabOrder1582652177242';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "app_appointment_lab_order_file_assoc" ("appointment_id" uuid NOT NULL, "file_id" uuid NOT NULL, CONSTRAINT "PK_4241858023b1f704be581854ea9" PRIMARY KEY ("appointment_id", "file_id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f11c7f4d6dc83cf3977a653197" ON "app_appointment_lab_order_file_assoc" ("appointment_id") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ecbdd6ea108c79c4178ab32450" ON "app_appointment_lab_order_file_assoc" ("file_id") `,
      undefined,
    );

    // Move all existing file refs to the new rel table
    await queryRunner.query(
      `INSERT INTO "app_appointment_lab_order_file_assoc" (
                                          appointment_id,
                                          file_id
                                        ) SELECT
                                             id,
                                             lab_order_file_id
                                        FROM app_appointment
                                        WHERE lab_order_file_id IS NOT NULL;
                                        `,
      undefined,
    );

    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_b8021fe67f5f18917f0e472cf8e"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_order_file_id"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" ADD CONSTRAINT "FK_f11c7f4d6dc83cf3977a653197b" FOREIGN KEY ("appointment_id") REFERENCES "app_appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" ADD CONSTRAINT "FK_ecbdd6ea108c79c4178ab32450c" FOREIGN KEY ("file_id") REFERENCES "app_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_order_file_id" uuid`, undefined);

    // Move all files from the rel table into the appointment table
    await queryRunner.query(
      `UPDATE app_appointment
                                      SET lab_order_file_id = subquery.file_id
                                      FROM
                                        (SELECT appointment_id, file_id FROM app_appointment_lab_order_file_assoc) AS subquery
                                      WHERE app_appointment.id = subquery.appointment_id`,
      undefined,
    );

    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" DROP CONSTRAINT "FK_ecbdd6ea108c79c4178ab32450c"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_lab_order_file_assoc" DROP CONSTRAINT "FK_f11c7f4d6dc83cf3977a653197b"`,
      undefined,
    );
    await queryRunner.query(`DROP INDEX "IDX_ecbdd6ea108c79c4178ab32450"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_f11c7f4d6dc83cf3977a653197"`, undefined);
    await queryRunner.query(`DROP TABLE "app_appointment_lab_order_file_assoc"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_b8021fe67f5f18917f0e472cf8e" FOREIGN KEY ("lab_order_file_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }
}
