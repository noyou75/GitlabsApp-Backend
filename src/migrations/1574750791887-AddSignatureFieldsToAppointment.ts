import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignatureFieldsToAppointment1574750791887 implements MigrationInterface {
  name = 'AddSignatureFieldsToAppointment1574750791887';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" RENAME COLUMN "lab_order_file_id" TO "lab_order_id"`, undefined);

    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "recipient" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "signature_id" uuid`, undefined);
    await queryRunner.query(`ALTER TYPE "public"."app_file_purpose_enum" RENAME TO "app_file_purpose_enum_old"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum" AS ENUM('avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'thumbnail', 'signature')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum" USING "purpose"::"text"::"app_file_purpose_enum"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum_old"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_972d55847a1f74acf4662fcd567" FOREIGN KEY ("signature_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_972d55847a1f74acf4662fcd567"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum_old" AS ENUM('avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'thumbnail')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum_old" USING "purpose"::"text"::"app_file_purpose_enum_old"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum"`, undefined);
    await queryRunner.query(`ALTER TYPE "app_file_purpose_enum_old" RENAME TO  "app_file_purpose_enum"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "signature_id"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "recipient"`, undefined);

    await queryRunner.query(`ALTER TABLE "app_appointment" RENAME COLUMN "lab_order_id" TO "lab_order_file_id"`, undefined);
  }
}
