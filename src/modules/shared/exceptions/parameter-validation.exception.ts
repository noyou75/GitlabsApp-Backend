import { ValidationError } from 'class-validator';

const _getValidationErrors = (validationError: ValidationError) => {
  let errors = [];

  /* Create a collection of strings containing the validation errors at this level. */
  const fieldErrors = Object.keys(validationError.constraints).map(key => {
    return `${key}: ${validationError.constraints[key]}`;
  }).join('; ');

  /* If the above amalgamation operation retrieved an actual string, append it to the errors set. */
  if (fieldErrors) {
    errors.push(fieldErrors);
  }

  /* If this error has child errors, we will need to recurse into each of those errors individually to assess
   * their various error scenarios. */
  (validationError.children || []).forEach(child => {
    errors = errors.concat(_getValidationErrors(child));
  });

  return errors;
};

const _validationErrorToString = (validationError: ValidationError) => {
  return _getValidationErrors(validationError).join('; ');
};

/**
 * ParameterValidationException is an Error-derived class that encapsulates a class-validator ValidationError object.  Useful for cases where inline business logic needs to throw
 * validation errors that cannot be easily deduced from the inbound DTO object alone.
 */
export class ParameterValidationException extends Error {
  constructor(public readonly validationError: ValidationError) {
    super(_validationErrorToString(validationError));

    const str = this.toString();
    console.log(str);
  }

  public toString() {
    /* Return a string containing all validation errors */
    return _validationErrorToString(this.validationError);
  }
}
