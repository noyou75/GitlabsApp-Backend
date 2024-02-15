import {MigrationInterface, QueryRunner} from "typeorm";

export class Credits1607354670231 implements MigrationInterface {
    name = 'Credits1607354670231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "app_credit_transaction_reason_enum" AS ENUM('CreditReversed', 'CreditRedemption', 'CreditRefunded')`);
        await queryRunner.query(`CREATE TABLE "app_credit_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "amount" integer NOT NULL, "reason" "app_credit_transaction_reason_enum" NOT NULL, "credit_id" uuid NOT NULL, "order_id" uuid, "staff_user_id" uuid, "patient_user_id" uuid, CONSTRAINT "PK_18d7df62bcd9a053e36babf093e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "app_credit_source_enum" AS ENUM('Referral', 'ExcessRefund', 'Other')`);
        await queryRunner.query(`CREATE TABLE "app_credit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "source" "app_credit_source_enum" NOT NULL, "original_amount" integer NOT NULL, "current_amount" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "notes" character varying, "created_by_id" uuid NOT NULL, "recipient_id" uuid NOT NULL, "valid_date_range_start_date" TIMESTAMP, "valid_date_range_end_date" TIMESTAMP, CONSTRAINT "PK_74d6fc8d229a334a84e9b8ba267" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" ADD CONSTRAINT "FK_40a272490cf1a2a7c6f7a8772f6" FOREIGN KEY ("credit_id") REFERENCES "app_credit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" ADD CONSTRAINT "FK_f0d715c62dc1c0724aa854dc9f5" FOREIGN KEY ("order_id") REFERENCES "app_appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" ADD CONSTRAINT "FK_383c7785d233cae0dcf2fe786c6" FOREIGN KEY ("staff_user_id") REFERENCES "app_staff_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" ADD CONSTRAINT "FK_83c70a8ad7a5c99b02bd1894521" FOREIGN KEY ("patient_user_id") REFERENCES "app_patient_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_credit" ADD CONSTRAINT "FK_08bdb92d1ae92218f3ad115500f" FOREIGN KEY ("created_by_id") REFERENCES "app_staff_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_credit" ADD CONSTRAINT "FK_4e624c762f379b8d7c04c319d2d" FOREIGN KEY ("recipient_id") REFERENCES "app_patient_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_credit" DROP CONSTRAINT "FK_4e624c762f379b8d7c04c319d2d"`);
        await queryRunner.query(`ALTER TABLE "app_credit" DROP CONSTRAINT "FK_08bdb92d1ae92218f3ad115500f"`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" DROP CONSTRAINT "FK_83c70a8ad7a5c99b02bd1894521"`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" DROP CONSTRAINT "FK_383c7785d233cae0dcf2fe786c6"`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" DROP CONSTRAINT "FK_f0d715c62dc1c0724aa854dc9f5"`);
        await queryRunner.query(`ALTER TABLE "app_credit_transaction" DROP CONSTRAINT "FK_40a272490cf1a2a7c6f7a8772f6"`);
        await queryRunner.query(`DROP TABLE "app_credit"`);
        await queryRunner.query(`DROP TYPE "app_credit_source_enum"`);
        await queryRunner.query(`DROP TABLE "app_credit_transaction"`);
        await queryRunner.query(`DROP TYPE "app_credit_transaction_reason_enum"`);
    }

}
