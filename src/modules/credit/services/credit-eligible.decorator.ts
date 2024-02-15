import {Type} from '@nestjs/common';
import {Product} from '../../product/product';

const CreditEligibleMetadataKey = 'CreditEligibleMetadataKey';

export function CreditEligible() {
  return (type: Type<Product>) => {
    /* Register the credit eligible metadata key against this product */
    Reflect.defineMetadata(CreditEligibleMetadataKey, CreditEligibleMetadataKey, type);
  };
}

export const isCreditEligible = (type: Type<Product>) => !!Reflect.getMetadata(CreditEligibleMetadataKey, type);
