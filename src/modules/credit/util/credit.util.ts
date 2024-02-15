import { isAfter, isBefore } from 'date-fns';
import { castArray } from 'lodash';
import { CreditEntity } from '../../../entities/credit.entity';

export const validateCredit = (credit: CreditEntity) => {
  const now = new Date();

  /* If we get here, the usage of this credit has passed all of the credit's conditions */
  return credit.isActive && (!credit.validDateRange ||
    ((!credit.validDateRange.startDate || isAfter(now, credit.validDateRange.startDate)) &&
      (!credit.validDateRange.endDate || isBefore(now, credit.validDateRange.endDate))));
};

export const getValidatedCredits = (
  credits: CreditEntity[] | CreditEntity,
  amount?: number,
  getCreditAmount: (credit: CreditEntity) => number = credit => credit.currentAmount,
) => {
  const result: CreditEntity[] = [];

  /* Retrieve the subset of credits that are required to satisfy the requested amount (credits are automatically sorted by
   * expiry date, with nearest expiry first, and nulls last). */
  let collected = 0;

  credits = castArray(credits);
  for (let i = 0; i < credits.length && (typeof amount !== 'number' || collected < amount); i++) {
    const credit = credits[i];

    /* First, ensure that the credit is valid. */
    if (!validateCredit(credit) || !credit.isActive) {
      continue;
    }

    /* Calculate the credit amount to be applied - if the resulting value is 0, skip tot he next credit. */
    const creditAmount = getCreditAmount(credit);
    if (!creditAmount) {
      continue;
    }

    /* Add the credit to the resulting total, and increment our total credits retrieved value. */
    result.push(credit);
    collected += creditAmount;
  }

  return result;
};
