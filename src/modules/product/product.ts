/**
 * Will serve as the base of the 'product' framework to generically identify products.  Very basic for now by design - but more to come...
 * In the new world, product would be a composing part of an Order entity.
 * Potential Order table design would include an array field containing IDs (entities implementing the Product interface), and type,
 * and the app tier would be responsible for figuring out how to populate the products according to this data.
 * But yes, more to come...
 */
export interface Product {
  id: string;
}
