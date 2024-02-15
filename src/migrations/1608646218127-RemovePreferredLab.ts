import {MigrationInterface, QueryRunner} from "typeorm";

export class RemovePreferredLab1608646218127 implements MigrationInterface {
    name = 'RemovePreferredLab1608646218127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "preferred_lab"`);
        await queryRunner.query(`DROP TYPE "public"."app_patient_user_preferred_lab_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."app_patient_user_preferred_lab_enum" AS ENUM('lab-corp', 'lab-xpress', 'quest-diagnostics')`);
        await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "preferred_lab" "app_patient_user_preferred_lab_enum"`);
    }

}
