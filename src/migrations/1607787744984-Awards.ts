import {forEach} from "p-iteration";
import {MigrationInterface, QueryRunner} from "typeorm";
import {generateReferralCode} from '../modules/user/patient/patient-user.util';

export class Awards1607787744984 implements MigrationInterface {
    name = 'Awards1607787744984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "app_award_campaign_award_type_enum" AS ENUM('OneTimeReferrerCreditAward')`);
        await queryRunner.query(`CREATE TYPE "app_award_campaign_award_conditions_enum" AS ENUM('FirstTimeBooking', 'PeerReferralActive')`);
        await queryRunner.query(`CREATE TYPE "app_award_campaign_trigger_enum" AS ENUM('AppointmentCompletion')`);
        await queryRunner.query(`CREATE TABLE "app_award_campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL default 'Default', "award" integer NOT NULL, "is_active" boolean NOT NULL, "award_type" "app_award_campaign_award_type_enum" NOT NULL, "award_conditions" "app_award_campaign_award_conditions_enum" array, "trigger" "app_award_campaign_trigger_enum" NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_29dfc5b305bbbdd673353df2120" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "app_peer_referral_status_enum" AS ENUM('Pending', 'Fulfilled', 'Cancelled')`);
        await queryRunner.query(`CREATE TABLE "app_peer_referral" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "status" "app_peer_referral_status_enum" NOT NULL DEFAULT 'Pending', "award_campaign_id" uuid, "referree_id" uuid, "referrer_id" uuid, CONSTRAINT "REL_a07e9824f2f348b766996c710b" UNIQUE ("referree_id"), CONSTRAINT "PK_2eaebb3868bdb11a7ed48188354" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "app_peer_referral" ADD CONSTRAINT "FK_12b0ffac8abcf7149631a6a5716" FOREIGN KEY ("award_campaign_id") REFERENCES "app_award_campaign"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_peer_referral" ADD CONSTRAINT "FK_a07e9824f2f348b766996c710bb" FOREIGN KEY ("referree_id") REFERENCES "app_patient_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_peer_referral" ADD CONSTRAINT "FK_26229c9944f0dc4ed4cb35acfd8" FOREIGN KEY ("referrer_id") REFERENCES "app_patient_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`INSERT INTO "app_award_campaign" ("id", "award", "is_active", "award_type", "award_conditions", "trigger", "is_default", "name") VALUES (DEFAULT, 500, true, 'OneTimeReferrerCreditAward', '{FirstTimeBooking,PeerReferralActive}', 'AppointmentCompletion', true, 'first-appointment')`)

        /* Update the existing referral code for each PatientUser record to use the new format... */
        await forEach(await queryRunner.query(`SELECT id FROM "app_patient_user" WHERE length("referral_code") > 7`), async (user: { id: string }) => {
          // Unique verification is skipped here as its causes the migration process to hang due to a bug in TypeORM
          // This shouldn't pose a problem as the identifier doesn't really need to be unique (just unique enough), and we don't have
          // nearly enough records in this table at this point to trigger a collision (probably...).
          await queryRunner.query(`UPDATE "app_patient_user" SET "referral_code" = '${await generateReferralCode(true)}' WHERE "id" = '${user.id}'`);
        });

        await queryRunner.query(`ALTER TABLE "app_credit" ALTER COLUMN "created_by_id" DROP NOT NULL;`);
        await queryRunner.query(`COMMENT ON COLUMN "app_credit"."created_by_id" IS NULL;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_peer_referral" DROP CONSTRAINT "FK_26229c9944f0dc4ed4cb35acfd8"`);
        await queryRunner.query(`ALTER TABLE "app_peer_referral" DROP CONSTRAINT "FK_a07e9824f2f348b766996c710bb"`);
        await queryRunner.query(`ALTER TABLE "app_peer_referral" DROP CONSTRAINT "FK_12b0ffac8abcf7149631a6a5716"`);
        await queryRunner.query(`DROP TABLE "app_peer_referral"`);
        await queryRunner.query(`DROP TYPE "app_peer_referral_status_enum"`);
        await queryRunner.query(`DROP TABLE "app_award_campaign"`);
        await queryRunner.query(`DROP TYPE "app_award_campaign_trigger_enum"`);
        await queryRunner.query(`DROP TYPE "app_award_campaign_award_conditions_enum"`);
        await queryRunner.query(`DROP TYPE "app_award_campaign_award_type_enum"`);
    }

}
