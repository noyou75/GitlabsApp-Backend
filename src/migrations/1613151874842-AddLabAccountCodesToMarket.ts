// import { enumKeys } from 'src/common/enum.utils';
// import { LabCompany } from 'src/common/enums/lab-company.enum';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLabAccountCodesToMarket1613151874842 implements MigrationInterface {
  name = 'AddLabAccountCodesToMarket1613151874842';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_market" ADD "lab_account_codes" jsonb`);

    // const defaultCodes = [];
    // enumKeys(LabCompany).forEach((key) => {
    //   defaultCodes.push({ company: LabCompany[key], account_number: '' });
    // });

    // await queryRunner.query(`UPDATE app_market SET lab_account_codes = $1`, [JSON.stringify(defaultCodes)]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_market" DROP COLUMN "lab_account_codes"`);
  }
}
