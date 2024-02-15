import { Injectable } from '@nestjs/common';
import { castArray } from 'lodash';
import { DeepPartial } from 'typeorm';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { CreditTransactionEntity, CreditTransactionReason } from '../../../entities/credit-transaction.entity';
import { CreditEntity } from '../../../entities/credit.entity';
import { PatientUser, StaffUser, User } from '../../../entities/user.entity';
import { CrudService } from '../../api/crud/crud.service';
import { Product } from '../../product/product';
import { getValidatedCredits, validateCredit } from '../util/credit.util';

@Injectable()
export class CreditService extends CrudService(CreditEntity) {
  // TODO all instances of 'order' must be replaced by a new order object, where an order is a collection of products, and an appointment
  //  is simply a product within that order (abstracted behind some generic interface so we don't have to have specific knowledge of it)
  async applyCredits(
    credits: CreditEntity[] | CreditEntity,
    order: Product,
    amountToApply?: number,
  ): Promise<number> {
    /* If amountToApply is not specified, set it to the total of the supplied credits. */
    amountToApply = typeof amountToApply === 'number' ? amountToApply :
      castArray(credits).reduce((accumulator, credit) => {
        accumulator += credit.currentAmount;
        return accumulator;
      }, 0);

    return this._doCreditAmountOperation(credits, amountToApply, (credit, remainingAmount) => {
      return Math.min(remainingAmount, credit.currentAmount) * -1;
    }, CreditTransactionReason.CreditRedemption, order);
  }

  getValidatedCredits(
    credits: CreditEntity[] | CreditEntity,
    amount?: number,
    getCreditAmount: (credit: CreditEntity) => number = credit => credit.currentAmount,
  ): CreditEntity[] {
    return getValidatedCredits(credits, amount, getCreditAmount);
  }

  refundCredits(credits: CreditEntity[] | CreditEntity, amount: number, order?: Product): Promise<number> {
    return this._doCreditAmountOperation(credits, amount, (credit, remainingAmount) => {
      return Math.min(remainingAmount, credit.getAppliedAmount());
    }, CreditTransactionReason.CreditRefunded, order);
  }

  revokeCredits(credits: CreditEntity | CreditEntity[], amount: number): Promise<number> {
    return this._doCreditAmountOperation(credits, amount, (credit, remainingAmount) => {
      return Math.min(remainingAmount, credit.currentAmount) * -1;
    }, CreditTransactionReason.CreditRevoked);
  }

  public validateCredit(credit: CreditEntity): boolean {
    return validateCredit(credit);
  }

  /**
   * doOperation must return a negative number if we are subtracting credit amounts
   * @private
   */
  private _doCreditAmountOperation(
    credits: CreditEntity | CreditEntity[],
    amount: number,
    doOperation: (credit: CreditEntity, remainingAmount: number) => number,
    transactionReason: CreditTransactionReason,
    order?: Product,
  ): Promise<number> {
    /* Coerce the supplied credits value to an array for even treatment. */
    credits = castArray(credits);
    const transactions: Promise<number>[] = [];

    for (let i = 0; i < credits.length && amount > 0; i++) {
      const credit = credits[i];

      /* We only operate on valid credits. */
      if (!this.validateCredit(credit)) {
        continue;
      }

      /* Perform the operation defined by the consumer. */
      const operatedAmount = doOperation(credit, amount);

      /* If the operated amount is 0, we will take no further action. */
      if (operatedAmount) {
        /* Create a transaction entity based on the operated details */

        transactions.push(this.update(credit, {
          currentAmount: credit.currentAmount + operatedAmount,
          transactions: [...(credit.transactions || []), this._generateTransactionRecord(transactionReason, operatedAmount, order)],
        }).then(updatedCredit => updatedCredit.currentAmount - credit.currentAmount));

        /* Decrement amount by the absolute value of the operated amount. */
        amount -= Math.abs(operatedAmount);
      }
    }

    /* Sum the results of each operation, and return a single promise delivering the total amount of credit change. */
    return Promise.all(transactions).then(operatedAmounts => {
      return operatedAmounts.reduce((collector, operatedAmount) => {
        collector += Math.abs(operatedAmount);
        return collector;
      }, 0);
    });
  }

  private _generateTransactionRecord(
    reason: CreditTransactionReason,
    amount: number,
    order?: Product,
  ) {
    /* Create a transaction record for this particular credit redemption */
    const txRecord: DeepPartial<CreditTransactionEntity> =  {
      reason,
      order: order && { id: order.id },
      amount,
    };

    /* Need to create a stripped-down duplicate of the supplied user object - this is necessary for PatientUser objects, as they
     * have an eagerly loaded relationship with credits, which has an eagerly loaded relationship with credit transaction.  This
     * effectively prevents circular resolution by TypeORM */
    const activeUser = RequestContext.get<User>(REQUEST_CONTEXT_USER);

    if (activeUser instanceof PatientUser) {
      txRecord.patientUser = { id: activeUser.id };
    } else if (activeUser instanceof StaffUser) {
      txRecord.staffUser = { id: activeUser.id };
    }

    return txRecord;
  }
}
