import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentSampleEntity1574484292854 implements MigrationInterface {
  name = 'AddAppointmentSampleEntity1574484292854';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TYPE "app_appointment_sample_type_enum" AS ENUM('yellow-sps-blood-culture', 'blood-culture-bottles', 'light-blue-sodium-citrate', 'serum-tube-plain-no-additive', 'red-clot-activator', 'red-gray-speckled-clot-activator-gel', 'gold-clot-activator-gel', 'green-sodium-heparin', 'green-gray-speckled-sodium-heparin-gel', 'green-lithium-heparin', 'light-green-lithium-heparin-gel', 'green-gray-speckled-lithium-heparin-gel', 'lavender-k2edta', 'lavender-k3edta', 'pink-k2edta', 'white-k2edta-gel', 'tan-k2edta-lead', 'yellow-sps-hla', 'gray-sodium-fluoride-potassium-oxalate', 'royal-blue-sodium-heparin', 'orange-thrombin', 'urine-container')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_appointment_sample_temperature_enum" AS ENUM('refrigerated', 'ambient', 'frozen')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_appointment_sample_processing_enum" AS ENUM('none', 'spin', 'spin-and-aliquot', 'chain-of-custody')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_appointment_sample" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "app_appointment_sample_type_enum" NOT NULL, "quantity" integer NOT NULL, "temperature" "app_appointment_sample_temperature_enum" NOT NULL, "processing" "app_appointment_sample_processing_enum" NOT NULL, "collected" boolean NOT NULL DEFAULT false, "processed" boolean NOT NULL DEFAULT false, "supplies_verified" boolean NOT NULL DEFAULT false, "appointment_id" uuid NOT NULL, CONSTRAINT "PK_030beb383101ace72cc57d91871" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "samples"`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment_sample" ADD CONSTRAINT "FK_09601173a7a5763935af87c9431" FOREIGN KEY ("appointment_id") REFERENCES "app_appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_appointment_sample" DROP CONSTRAINT "FK_09601173a7a5763935af87c9431"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "samples" jsonb`, undefined);
    await queryRunner.query(`DROP TABLE "app_appointment_sample"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_sample_processing_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_sample_temperature_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_sample_type_enum"`, undefined);
  }
}
