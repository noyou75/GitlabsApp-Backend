import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedLabLocationEntity1573885097541 implements MigrationInterface {
  name = 'AddedLabLocationEntity1573885097541';

  public async up(queryRunner: QueryRunner): Promise<any> {
    // Remove unused column
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "payment_transfer_id"`, undefined);

    // Create LabLocation table
    await queryRunner.query(`CREATE TYPE "app_lab_location_lab_enum" AS ENUM('lab-corp', 'quest-diagnostics', 'lab-xpress')`, undefined);
    await queryRunner.query(
      `CREATE TABLE "app_lab_location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "place_id" character varying NOT NULL, "lab" "app_lab_location_lab_enum" NOT NULL, "active" boolean NOT NULL, "address_service_area_id" uuid, "address_street" character varying, "address_unit" character varying, "address_city" character varying, "address_state" character varying, "address_zip_code" character varying, "address_geo" geography(Point,4326), CONSTRAINT "UQ_fbcbb02693520eebb3ea09632bd" UNIQUE ("place_id"), CONSTRAINT "PK_9d8f0fd150fad33ea8d2b162352" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a27cc89a66b8940538bf0da778" ON "app_lab_location" USING GiST ("address_geo") `, undefined);

    // Add unit details to address for users
    await queryRunner.query(`ALTER TABLE "app_patient_user" ADD "address_unit" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" ADD "address_unit" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "app_staff_user" ADD "address_unit" character varying`, undefined);

    // Add LabXpress to preferred lab options in PatientUser table
    await queryRunner.query(
      `ALTER TYPE "public"."app_patient_user_preferred_lab_enum" RENAME TO "app_patient_user_preferred_lab_enum_old"`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_patient_user_preferred_lab_enum" AS ENUM('lab-corp', 'quest-diagnostics', 'lab-xpress')`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_patient_user" ALTER COLUMN "preferred_lab" TYPE "app_patient_user_preferred_lab_enum" USING "preferred_lab"::"text"::"app_patient_user_preferred_lab_enum"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_patient_user_preferred_lab_enum_old"`, undefined);

    // Add LabLocation relation to Appointment table
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "lab_location_id" uuid`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_lab_location" ADD CONSTRAINT "FK_9f91ad92d6156c5fd7147f70d5f" FOREIGN KEY ("address_service_area_id") REFERENCES "app_service_area"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_68f669f833a9bccde519a1f235b" FOREIGN KEY ("lab_location_id") REFERENCES "app_lab_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_68f669f833a9bccde519a1f235b"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_lab_location" DROP CONSTRAINT "FK_9f91ad92d6156c5fd7147f70d5f"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "lab_location_id"`, undefined);
    await queryRunner.query(`CREATE TYPE "app_patient_user_preferred_lab_enum_old" AS ENUM('lab-corp', 'quest-diagnostics')`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_patient_user" ALTER COLUMN "preferred_lab" TYPE "app_patient_user_preferred_lab_enum_old" USING "preferred_lab"::"text"::"app_patient_user_preferred_lab_enum_old"`,
      undefined,
    );
    await queryRunner.query(`DROP TYPE "app_patient_user_preferred_lab_enum"`, undefined);
    await queryRunner.query(
      `ALTER TYPE "app_patient_user_preferred_lab_enum_old" RENAME TO  "app_patient_user_preferred_lab_enum"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_staff_user" DROP COLUMN "address_unit"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP COLUMN "address_unit"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP COLUMN "address_unit"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_a27cc89a66b8940538bf0da778"`, undefined);
    await queryRunner.query(`DROP TABLE "app_lab_location"`, undefined);
    await queryRunner.query(`DROP TYPE "app_lab_location_lab_enum"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "payment_transfer_id" character varying`, undefined);
  }
}
