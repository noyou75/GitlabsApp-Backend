import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccudrawDocField1600096023248 implements MigrationInterface {
  name = 'AccudrawDocField1600096023248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "accu_draw_id" uuid`, undefined);
    await queryRunner.query(`ALTER TYPE "public"."app_file_purpose_enum" RENAME TO "app_file_purpose_enum_old"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum" AS ENUM('avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'thumbnail', 'signature', 'abn-document', 'accu-draw')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum" USING "purpose"::"text"::"app_file_purpose_enum"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum_old"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_94950f1e84e479b86e868c464ee" FOREIGN KEY ("accu_draw_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_94950f1e84e479b86e868c464ee"`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum_old" AS ENUM('abn-document', 'avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'signature', 'thumbnail')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ALTER COLUMN "purpose" TYPE "app_file_purpose_enum_old" USING "purpose"::"text"::"app_file_purpose_enum_old"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum"`, undefined);
    await queryRunner.query(`ALTER TYPE "app_file_purpose_enum_old" RENAME TO  "app_file_purpose_enum"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "accu_draw_id"`, undefined);
  }
}
