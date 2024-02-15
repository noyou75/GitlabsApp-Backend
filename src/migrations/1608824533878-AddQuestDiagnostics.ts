import {MigrationInterface, QueryRunner} from "typeorm";

export class AddQuestDiagnostics1608824533878 implements MigrationInterface {
    name = 'AddQuestDiagnostics1608824533878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."app_lab_location_lab_enum" RENAME TO "app_lab_location_lab_enum_old"`);
        await queryRunner.query(`CREATE TYPE "app_lab_location_lab_enum" AS ENUM('lab-corp', 'quest-diagnostics', 'sonora-quest', 'lab-xpress')`);
        await queryRunner.query(`ALTER TABLE "app_lab_location" ALTER COLUMN "lab" TYPE "app_lab_location_lab_enum" USING "lab"::"text"::"app_lab_location_lab_enum"`);
        await queryRunner.query(`DROP TYPE "app_lab_location_lab_enum_old"`);
        await queryRunner.query(`UPDATE app_lab_location SET lab = 'sonora-quest' WHERE lab = 'quest-diagnostics'`);
        await queryRunner.query(`ALTER TYPE "public"."app_lab_order_details_lab_enum" RENAME TO "app_lab_order_details_lab_enum_old"`);
        await queryRunner.query(`CREATE TYPE "app_lab_order_details_lab_enum" AS ENUM('lab-corp', 'quest-diagnostics', 'sonora-quest', 'lab-xpress')`);
        await queryRunner.query(`ALTER TABLE "app_lab_order_details" ALTER COLUMN "lab" TYPE "app_lab_order_details_lab_enum" USING "lab"::"text"::"app_lab_order_details_lab_enum"`);
        await queryRunner.query(`DROP TYPE "app_lab_order_details_lab_enum_old"`);
        await queryRunner.query(`UPDATE app_lab_order_details SET lab = 'sonora-quest' WHERE lab = 'quest-diagnostics'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE app_lab_order_details SET lab = 'quest-diagnostics' WHERE lab = 'sonora-quest'`);
        await queryRunner.query(`CREATE TYPE "app_lab_order_details_lab_enum_old" AS ENUM('lab-corp', 'lab-xpress', 'quest-diagnostics')`);
        await queryRunner.query(`ALTER TABLE "app_lab_order_details" ALTER COLUMN "lab" TYPE "app_lab_order_details_lab_enum_old" USING "lab"::"text"::"app_lab_order_details_lab_enum_old"`);
        await queryRunner.query(`DROP TYPE "app_lab_order_details_lab_enum"`);
        await queryRunner.query(`ALTER TYPE "app_lab_order_details_lab_enum_old" RENAME TO  "app_lab_order_details_lab_enum"`);
        await queryRunner.query(`UPDATE app_lab_location SET lab = 'quest-diagnostics' WHERE lab = 'sonora-quest'`);
        await queryRunner.query(`CREATE TYPE "app_lab_location_lab_enum_old" AS ENUM('lab-corp', 'lab-xpress', 'quest-diagnostics')`);
        await queryRunner.query(`ALTER TABLE "app_lab_location" ALTER COLUMN "lab" TYPE "app_lab_location_lab_enum_old" USING "lab"::"text"::"app_lab_location_lab_enum_old"`);
        await queryRunner.query(`DROP TYPE "app_lab_location_lab_enum"`);
        await queryRunner.query(`ALTER TYPE "app_lab_location_lab_enum_old" RENAME TO  "app_lab_location_lab_enum"`);
    }

}
