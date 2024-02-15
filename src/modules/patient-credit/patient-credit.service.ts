import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ValidationError } from 'class-validator';
import { CreditSourceEnum } from '../../common/enums/credit-source.enum';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { CreditEntity } from '../../entities/credit.entity';
import { DateRangeEmbed } from '../../entities/embed/date-range.embed';
import { PatientUser, StaffUser } from '../../entities/user.entity';
import { CreditService } from '../credit/services/credit.service';
import { Product } from '../product/product';
import { ParameterValidationException } from '../shared/exceptions/parameter-validation.exception';
import { PatientUserService } from '../user/patient/patient-user.service';

interface IssueCreditOptions extends Partial<CreditEntity> {
  notes?: string;
  validDateRange?: DateRangeEmbed;
  createdBy?: StaffUser;
}

@Injectable()
export class PatientCreditService {
  constructor(
    private readonly patientUserService: PatientUserService,
    private readonly creditService: CreditService,
  ) {}

  getBalance(entity: PatientUser): number {
    /* Retrieve the balance of all active credits on the user. */
    return this.creditService.getValidatedCredits(entity.credits).reduce((collector, credit) => {
      collector += credit.currentAmount;
      return collector;
    }, 0);
  }

  async issueCredit(
    entity: PatientUser,
    amount: number,
    source: CreditSourceEnum,
    extra?: IssueCreditOptions,
  ): Promise<CreditEntity> {
    /* Create a new credit entity based on the supplied details, and return the resulting credit. */
    const credit = new CreditEntity();
    const user = RequestContext.get(REQUEST_CONTEXT_USER);

    Object.assign(credit, {
      /* We only track the createdBy user if the current user is a staff user. */
      createdBy: user && user instanceof StaffUser ? user : undefined,
      originalAmount: amount,
      currentAmount: amount,
      source,
      transactions: [],

      ...extra,
      recipient: entity,
    });

    /* Create the new credit */
    return this.creditService.create(credit);
  }

  async revokeCredit(entity: PatientUser, amount: number): Promise<number> {
    /* Ensure that the credit account's available balance is greater than the revocation amount.  If not, throw a 400. */
    if (this.getBalance(entity) < amount) {
      throw this._getAmountException(amount, { balanceMax: 'User has fewer active credits than the supplied revocation amount.' });
    }

    /* Revoke the supplied amount from the retrieved credit set. */
    return this.creditService.revokeCredits(entity.credits, amount);
  }

  async refundCredit(entity: PatientUser, amount: number, order?: Product): Promise<number> {
    /* Validation - ensure that the user's consumed credit balance is able to cover the refund amount */
    if (this.getTotalAppliedAmount(entity) < amount) {
      throw this._getAmountException(amount, { consumedMax: 'Refund amount is greater than the amount of consumed credits.' });
    }

    /* Retrieve the set of credits that would need to be replenished by the supplied amount.  If a product is supplied, we will
     * attempt to first isolate the credits that were applied to that product (assuming they are still valid). */
    const refundCredits: CreditEntity[] = [];
    let refundCreditsAmount = 0;

    const otherValidCredits = this.creditService.getValidatedCredits(entity.credits, undefined, credit => {
      const appliedAmount = credit.getAppliedAmount();

      if (order && appliedAmount && credit.transactions.some(transaction => transaction.orderId === order.id)) {
        refundCredits.push(credit);
        refundCreditsAmount += appliedAmount;

        /* Return 0 to take this product-specific credit out of the allValidCredits collection.  This will be helpful if we
         * need to gross up refundCredits with credits from the greater collection, as we will not have to check if those
         * credits already exist in the collected collection. */
        return 0;
      }

      return appliedAmount;
    });

    /* If the set of product credits is not enough to cover the refund amount, gross up the set of product credits until we
     * reach an appropriate credit set. */
    for (let i = 0; i < otherValidCredits.length && refundCreditsAmount < amount; i++) {
      refundCredits.push(otherValidCredits[i]);
      refundCreditsAmount += otherValidCredits[i].getAppliedAmount();
    }

    /* Replenish each of the credits according to the outstanding amount, and return a promise resolving to the refunded credit
     * amount. */
    return this.creditService.refundCredits(refundCredits, amount, order);
  }

  async applyCredit(entity: PatientUser, amount: number, product: Product) {
    /* Ensure that a credit account exists for this user, and that the account has enough credits to cover the credit
     * application. */
    if (this.getBalance(entity) < amount) {
      throw this._getAmountException(amount,
        { balanceMax: 'The user\'s credit balance is less than the requested redemption amount.' });
    }

    /* Determine the set of credits that would need to be applied in order to apply the requested amount. */
    const credits = this.creditService.getValidatedCredits(entity.credits);

    /* Apply the supplied credits via the embedded instance of CreditService */
    return this.creditService.applyCredits(credits, product, amount);
  }

  /**
   * Retrieves the consumed balance for all active credits on a given entity.
   */
  getTotalAppliedAmount(entity: PatientUser): number {
    return this.creditService.getValidatedCredits(entity.credits, undefined, credit => credit.getAppliedAmount())
      .reduce((collector, credit) => {
        collector += (credit.originalAmount - credit.currentAmount);
        return collector;
      }, 0);
  }

  private _getAmountException(amount: number, constraints: { [key: string]: string }) {
    return new ParameterValidationException(plainToClass(ValidationError, {
      property: 'amount',
      value: amount,
      constraints,
    }))
  }
}
