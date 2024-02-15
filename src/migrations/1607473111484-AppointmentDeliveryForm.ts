import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentDeliveryForm1607473111484 implements MigrationInterface {
  name = 'AppointmentDeliveryForm1607473111484';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "delivery_form_id" uuid`);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD CONSTRAINT "UQ_2e538662e3de55b8797bf35010c" UNIQUE ("delivery_form_id")`);
    await queryRunner.query(`ALTER TYPE "public"."app_file_purpose_enum" RENAME TO "app_file_purpose_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum" AS ENUM('avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'thumbnail', 'signature', 'abn-document', 'accu-draw', 'appointment-delivery-form')`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum" USING "purpose"::"text"::"app_file_purpose_enum"`,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_2e538662e3de55b8797bf35010c" FOREIGN KEY ("delivery_form_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_2e538662e3de55b8797bf35010c"`);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum_old" AS ENUM('abn-document', 'accu-draw', 'avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'signature', 'thumbnail')`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum_old" USING "purpose"::"text"::"app_file_purpose_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum"`);
    await queryRunner.query(`ALTER TYPE "app_file_purpose_enum_old" RENAME TO  "app_file_purpose_enum"`);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "UQ_2e538662e3de55b8797bf35010c"`);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "delivery_form_id"`);
  }
}
