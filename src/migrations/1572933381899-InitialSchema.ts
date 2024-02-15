import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1572933381899 implements MigrationInterface {
  name = 'InitialSchema1572933381899';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "app_service_area" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "city" character varying NOT NULL, "county" character varying NOT NULL, "state" character varying NOT NULL, "zip_code" character varying NOT NULL, "geo" geography(Point) NOT NULL, "active" boolean NOT NULL, CONSTRAINT "UQ_3df2375cae3d062634e53d22de8" UNIQUE ("zip_code"), CONSTRAINT "PK_d69662e008321f68c8908696632" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`CREATE INDEX "IDX_4cbb37169fb1939352cfd1d82d" ON "app_service_area" USING GiST ("geo") `, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_file_purpose_enum" AS ENUM('avatar', 'insurance-front', 'insurance-rear', 'lab-order', 'thumbnail')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "purpose" "app_file_purpose_enum" NOT NULL, "hash" character varying NOT NULL, "name" character varying NOT NULL, "size" integer NOT NULL, "type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "thumbnail_id" uuid, "patient_id" uuid, "specialist_id" uuid, "staff_id" uuid, CONSTRAINT "REL_916e2fc767223a2a45e11ac5df" UNIQUE ("thumbnail_id"), CONSTRAINT "PK_e432bb99db5406c0b94289e3809" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`CREATE TYPE "app_patient_user_gender_enum" AS ENUM('male', 'female', 'other')`, undefined);
    await queryRunner.query(`CREATE TYPE "app_patient_user_preferred_lab_enum" AS ENUM('lab-corp', 'quest-diagnostics')`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_patient_user_deactivation_reason_enum" AS ENUM('patient-requested', 'duplicate-account', 'inappropriate-behavior', 'frequent-cancellations', 'frequent-no-shows', 'other')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_patient_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "phone_number" character varying NOT NULL, "password" character varying, "first_name" character varying, "last_name" character varying, "dob" TIMESTAMP, "gender" "app_patient_user_gender_enum", "timezone" character varying, "deactivation_date" TIMESTAMP, "deactivation_note" character varying, "documents" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "notes" character varying, "prior_issues" character varying, "referral_code" character varying NOT NULL, "preferred_lab" "app_patient_user_preferred_lab_enum", "deactivation_reason" "app_patient_user_deactivation_reason_enum", "avatar_id" uuid, "address_service_area_id" uuid, "insurance_front_id" uuid, "insurance_rear_id" uuid, "address_street" character varying, "address_city" character varying, "address_state" character varying, "address_zip_code" character varying, "address_geo" geography(Point), "insurance_expires_at" TIMESTAMP, "payment_profile_external_id" character varying, "payment_profile_card_brand" character varying, "payment_profile_last4" integer, "payment_profile_cardholder_name" character varying, "payment_profile_exp_month" integer, "payment_profile_exp_year" integer, CONSTRAINT "UQ_737620bf67ca3707b0b515b1a26" UNIQUE ("email"), CONSTRAINT "UQ_e68b3c7cf819d0aca54cecdc641" UNIQUE ("phone_number"), CONSTRAINT "REL_d32ddafccbb4a5f40914645c92" UNIQUE ("avatar_id"), CONSTRAINT "PK_b20712d3c53fd28380acd4fdc59" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`CREATE INDEX "IDX_737620bf67ca3707b0b515b1a2" ON "app_patient_user" ("email") `, undefined);
    await queryRunner.query(`CREATE INDEX "IDX_e68b3c7cf819d0aca54cecdc64" ON "app_patient_user" ("phone_number") `, undefined);
    await queryRunner.query(`CREATE INDEX "IDX_84838e675b83978c23687ab705" ON "app_patient_user" USING GiST ("address_geo") `, undefined);
    await queryRunner.query(
      `CREATE INDEX "IDX_62bb35edecee2ade2bb2ff9e54" ON "app_patient_user" ("payment_profile_external_id") `,
      undefined,
    );
    await queryRunner.query(`CREATE TYPE "app_specialist_user_gender_enum" AS ENUM('male', 'female', 'other')`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_specialist_user_deactivation_reason_enum" AS ENUM('no-show', 'sample-drop-off-late', 'poor-performance', 'untrustworthy', 'unprofessional', 'patient-complaints', 'rarely-available', 'frequent-cancellations', 'other')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_specialist_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "phone_number" character varying NOT NULL, "password" character varying, "first_name" character varying, "last_name" character varying, "dob" TIMESTAMP, "gender" "app_specialist_user_gender_enum", "timezone" character varying, "deactivation_date" TIMESTAMP, "deactivation_note" character varying, "documents" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "schedule" jsonb, "deactivation_reason" "app_specialist_user_deactivation_reason_enum", "ssn_last4" integer, "timekit_resource_id" character varying, "avatar_id" uuid, "address_service_area_id" uuid, "address_street" character varying, "address_city" character varying, "address_state" character varying, "address_zip_code" character varying, "address_geo" geography(Point), "details_why" character varying, "details_experience" character varying, "details_year_started" integer, "details_education" character varying, "details_about" character varying, "payout_profile_external_id" character varying, CONSTRAINT "UQ_b4c0d91ad540ca7391858606991" UNIQUE ("email"), CONSTRAINT "UQ_a4e94eda123246e2c8df1936884" UNIQUE ("phone_number"), CONSTRAINT "REL_b169532ffb3905132bacf21653" UNIQUE ("avatar_id"), CONSTRAINT "PK_85ade064e3dcc3d12daaeb3ff3c" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`CREATE INDEX "IDX_b4c0d91ad540ca739185860699" ON "app_specialist_user" ("email") `, undefined);
    await queryRunner.query(`CREATE INDEX "IDX_a4e94eda123246e2c8df193688" ON "app_specialist_user" ("phone_number") `, undefined);
    await queryRunner.query(
      `CREATE INDEX "IDX_003f76fe223a724856a2e7878c" ON "app_specialist_user" USING GiST ("address_geo") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1eda8a13484ab72817e42e1540" ON "app_specialist_user" ("payout_profile_external_id") `,
      undefined,
    );
    await queryRunner.query(`CREATE TYPE "app_staff_user_gender_enum" AS ENUM('male', 'female', 'other')`, undefined);
    await queryRunner.query(`CREATE TYPE "app_staff_user_access_level_enum" AS ENUM('support', 'admin')`, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_staff_user_deactivation_reason_enum" AS ENUM('no-longer-employed', 'repeat-mistakes', 'untrustworthy', 'unprofessional', 'other')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_staff_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "phone_number" character varying NOT NULL, "password" character varying, "first_name" character varying, "last_name" character varying, "dob" TIMESTAMP, "gender" "app_staff_user_gender_enum", "timezone" character varying, "deactivation_date" TIMESTAMP, "deactivation_note" character varying, "documents" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "access_level" "app_staff_user_access_level_enum" NOT NULL, "deactivation_reason" "app_staff_user_deactivation_reason_enum", "avatar_id" uuid, "address_service_area_id" uuid, "address_street" character varying, "address_city" character varying, "address_state" character varying, "address_zip_code" character varying, "address_geo" geography(Point), CONSTRAINT "UQ_d9f74b2fd7d85e123d792c3f4b0" UNIQUE ("email"), CONSTRAINT "UQ_0c0fac43b7902b195cffa0e6c12" UNIQUE ("phone_number"), CONSTRAINT "REL_5fa6d497da472e4be40b5f808d" UNIQUE ("avatar_id"), CONSTRAINT "PK_ce605f76e2a11363eae712a7f9f" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d9f74b2fd7d85e123d792c3f4b" ON "app_staff_user" ("email") `, undefined);
    await queryRunner.query(`CREATE INDEX "IDX_0c0fac43b7902b195cffa0e6c1" ON "app_staff_user" ("phone_number") `, undefined);
    await queryRunner.query(`CREATE INDEX "IDX_63f4373f9fb4e284724ba44a58" ON "app_staff_user" USING GiST ("address_geo") `, undefined);
    await queryRunner.query(
      `CREATE TYPE "app_appointment_cancel_reason_enum" AS ENUM('no-answer', 'no-confirm', 'patient-requested', 'patient-failed-to-fast', 'lab-order-unclear', 'specialist-insufficient-supplies', 'specialist-unavailable', 'specialist-no-show', 'logistics-issue', 'ops-insufficient-supplies', 'rebooked', 'other')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_appointment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "samples" jsonb, "cancel_reason" "app_appointment_cancel_reason_enum", "cancel_note" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "payment_intent_id" character varying NOT NULL, "payment_transfer_id" character varying, "timekit_booking_id" character varying NOT NULL, "patient_id" uuid NOT NULL, "specialist_id" uuid NOT NULL, "rebooked_to_id" uuid, "status_id" uuid, "lab_order_file_id" uuid, CONSTRAINT "REL_6ef57b8b6eda1d9a3a98a949e7" UNIQUE ("rebooked_to_id"), CONSTRAINT "PK_d356abf4506e7772b14cad7f216" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_appointment_status_status_enum" AS ENUM('cancelled', 'pending', 'confirmed', 'in-progress', 'collected', 'delivered')`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "app_appointment_status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "app_appointment_status_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL, "appointment_id" uuid NOT NULL, CONSTRAINT "PK_9cb0aff9896a355047239134357" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TYPE "app_audit_log_resource_enum" AS ENUM('user:patient', 'user:specialist', 'user:staff', 'appointment')`,
      undefined,
    );
    await queryRunner.query(`CREATE TYPE "app_audit_log_action_enum" AS ENUM('create', 'modify', 'remove')`, undefined);
    await queryRunner.query(
      `CREATE TABLE "app_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resource" "app_audit_log_resource_enum" NOT NULL, "identifier" character varying NOT NULL, "action" "app_audit_log_action_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "patient_id" uuid, "specialist_id" uuid, "staff_id" uuid, CONSTRAINT "PK_35fc195b08d45672c9fd56de823" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d610fc968857382f04bd36ab81" ON "app_audit_log" ("resource", "identifier") `, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_file" ADD CONSTRAINT "FK_916e2fc767223a2a45e11ac5dfa" FOREIGN KEY ("thumbnail_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ADD CONSTRAINT "FK_6f356a524b43512cf6c036f14ab" FOREIGN KEY ("patient_id") REFERENCES "app_patient_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ADD CONSTRAINT "FK_ce3c4d71d810870624f1f06cc05" FOREIGN KEY ("specialist_id") REFERENCES "app_specialist_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_file" ADD CONSTRAINT "FK_22a6488c9141c880041bf9c01ff" FOREIGN KEY ("staff_id") REFERENCES "app_staff_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_patient_user" ADD CONSTRAINT "FK_d32ddafccbb4a5f40914645c922" FOREIGN KEY ("avatar_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_patient_user" ADD CONSTRAINT "FK_55c3044a640ea1c26dfca191038" FOREIGN KEY ("address_service_area_id") REFERENCES "app_service_area"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_patient_user" ADD CONSTRAINT "FK_1dec692f28baf850fcb9059719e" FOREIGN KEY ("insurance_front_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_patient_user" ADD CONSTRAINT "FK_b33752fc56ecca72bcf284310e3" FOREIGN KEY ("insurance_rear_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_specialist_user" ADD CONSTRAINT "FK_b169532ffb3905132bacf21653f" FOREIGN KEY ("avatar_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_specialist_user" ADD CONSTRAINT "FK_1c70c94883227bcdbaec599e24e" FOREIGN KEY ("address_service_area_id") REFERENCES "app_service_area"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_staff_user" ADD CONSTRAINT "FK_5fa6d497da472e4be40b5f808da" FOREIGN KEY ("avatar_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_staff_user" ADD CONSTRAINT "FK_5d91b1a5164b3dbbb8e94a7b4f9" FOREIGN KEY ("address_service_area_id") REFERENCES "app_service_area"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_283159731ebca64975f266461f7" FOREIGN KEY ("patient_id") REFERENCES "app_patient_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_1e9529c1e05274536b6c38d35e5" FOREIGN KEY ("specialist_id") REFERENCES "app_specialist_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_6ef57b8b6eda1d9a3a98a949e7d" FOREIGN KEY ("rebooked_to_id") REFERENCES "app_appointment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_9cb0aff9896a355047239134357" FOREIGN KEY ("status_id") REFERENCES "app_appointment_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_b0520b4a1f6958d01d941729352" FOREIGN KEY ("lab_order_file_id") REFERENCES "app_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_appointment_status" ADD CONSTRAINT "FK_36e23eb821db06ab5cbe423db54" FOREIGN KEY ("appointment_id") REFERENCES "app_appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_audit_log" ADD CONSTRAINT "FK_8c88e51d05049dabc12bed33152" FOREIGN KEY ("patient_id") REFERENCES "app_patient_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_audit_log" ADD CONSTRAINT "FK_29bfa62e8f9d5a10d1a46d0a81c" FOREIGN KEY ("specialist_id") REFERENCES "app_specialist_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "app_audit_log" ADD CONSTRAINT "FK_3d5688e4c1c7a0db974eba9d888" FOREIGN KEY ("staff_id") REFERENCES "app_staff_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "app_audit_log" DROP CONSTRAINT "FK_3d5688e4c1c7a0db974eba9d888"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_audit_log" DROP CONSTRAINT "FK_29bfa62e8f9d5a10d1a46d0a81c"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_audit_log" DROP CONSTRAINT "FK_8c88e51d05049dabc12bed33152"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment_status" DROP CONSTRAINT "FK_36e23eb821db06ab5cbe423db54"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_b0520b4a1f6958d01d941729352"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_9cb0aff9896a355047239134357"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_6ef57b8b6eda1d9a3a98a949e7d"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_1e9529c1e05274536b6c38d35e5"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_283159731ebca64975f266461f7"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_staff_user" DROP CONSTRAINT "FK_5d91b1a5164b3dbbb8e94a7b4f9"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_staff_user" DROP CONSTRAINT "FK_5fa6d497da472e4be40b5f808da"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP CONSTRAINT "FK_1c70c94883227bcdbaec599e24e"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_specialist_user" DROP CONSTRAINT "FK_b169532ffb3905132bacf21653f"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP CONSTRAINT "FK_b33752fc56ecca72bcf284310e3"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP CONSTRAINT "FK_1dec692f28baf850fcb9059719e"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP CONSTRAINT "FK_55c3044a640ea1c26dfca191038"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_patient_user" DROP CONSTRAINT "FK_d32ddafccbb4a5f40914645c922"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_file" DROP CONSTRAINT "FK_22a6488c9141c880041bf9c01ff"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_file" DROP CONSTRAINT "FK_ce3c4d71d810870624f1f06cc05"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_file" DROP CONSTRAINT "FK_6f356a524b43512cf6c036f14ab"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_file" DROP CONSTRAINT "FK_916e2fc767223a2a45e11ac5dfa"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_d610fc968857382f04bd36ab81"`, undefined);
    await queryRunner.query(`DROP TABLE "app_audit_log"`, undefined);
    await queryRunner.query(`DROP TYPE "app_audit_log_action_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_audit_log_resource_enum"`, undefined);
    await queryRunner.query(`DROP TABLE "app_appointment_status"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_status_status_enum"`, undefined);
    await queryRunner.query(`DROP TABLE "app_appointment"`, undefined);
    await queryRunner.query(`DROP TYPE "app_appointment_cancel_reason_enum"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_63f4373f9fb4e284724ba44a58"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_0c0fac43b7902b195cffa0e6c1"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_d9f74b2fd7d85e123d792c3f4b"`, undefined);
    await queryRunner.query(`DROP TABLE "app_staff_user"`, undefined);
    await queryRunner.query(`DROP TYPE "app_staff_user_deactivation_reason_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_staff_user_access_level_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_staff_user_gender_enum"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_1eda8a13484ab72817e42e1540"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_003f76fe223a724856a2e7878c"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_a4e94eda123246e2c8df193688"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_b4c0d91ad540ca739185860699"`, undefined);
    await queryRunner.query(`DROP TABLE "app_specialist_user"`, undefined);
    await queryRunner.query(`DROP TYPE "app_specialist_user_deactivation_reason_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_specialist_user_gender_enum"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_62bb35edecee2ade2bb2ff9e54"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_84838e675b83978c23687ab705"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_e68b3c7cf819d0aca54cecdc64"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_737620bf67ca3707b0b515b1a2"`, undefined);
    await queryRunner.query(`DROP TABLE "app_patient_user"`, undefined);
    await queryRunner.query(`DROP TYPE "app_patient_user_deactivation_reason_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_patient_user_preferred_lab_enum"`, undefined);
    await queryRunner.query(`DROP TYPE "app_patient_user_gender_enum"`, undefined);
    await queryRunner.query(`DROP TABLE "app_file"`, undefined);
    await queryRunner.query(`DROP TYPE "app_file_purpose_enum"`, undefined);
    await queryRunner.query(`DROP INDEX "IDX_4cbb37169fb1939352cfd1d82d"`, undefined);
    await queryRunner.query(`DROP TABLE "app_service_area"`, undefined);
  }
}
