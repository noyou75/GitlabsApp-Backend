/**
 * Determines if the supplied type is a primitive.  Includes primitives that are boxed.
 */
export const isPrimitiveType = (type: any) => {
  return typeof type !== 'function' || !type.constructor || [Boolean, String, Number].includes(type);
};
