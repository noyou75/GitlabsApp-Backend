import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCouponToAppointment1592960150300 implements MigrationInterface {
  name = 'AddCouponToAppointment1592960150300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" ADD "coupon_id" uuid`, undefined);
    await queryRunner.query(
      `ALTER TABLE "app_appointment" ADD CONSTRAINT "FK_f6fbd6b74693a0e29eadd8d346e" FOREIGN KEY ("coupon_id") REFERENCES "app_coupon"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP CONSTRAINT "FK_f6fbd6b74693a0e29eadd8d346e"`, undefined);
    await queryRunner.query(`ALTER TABLE "app_appointment" DROP COLUMN "coupon_id"`, undefined);
  }
}
