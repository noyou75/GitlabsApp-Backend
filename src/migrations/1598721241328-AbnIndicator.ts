import { MigrationInterface, QueryRunner } from 'typeorm';

export class AbnIndicator1598721241328 implements MigrationInterface {
  name = 'AbnIndicator1598721241328';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "is_medicare" boolean`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "abn_document_id" uuid`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_94affa25be33feba49dc20d321e" FOREIGN KEY ("abn_document_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(`ALTER TYPE "public"."app_file_purpose_enum" RENAME TO "app_file_purpose_enum_old"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum" AS ENUM('avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'thumbnail', 'signature', 'abn-document')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum" USING "purpose"::"text"::"app_file_purpose_enum"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum_old"`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_94affa25be33feba49dc20d321e"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "abn_document_id"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "is_medicare"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum_old" AS ENUM('avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'signature', 'thumbnail')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum_old" USING "purpose"::"text"::"app_file_purpose_enum_old"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum"`, undefined);
    await queryRunner.query(`ALTER TYPE "app_file_purpose_enum_old" RENAME TO  "app_file_purpose_enum"`, undefined);
  }
}
