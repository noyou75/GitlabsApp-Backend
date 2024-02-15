import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ParameterValidationException } from '../exceptions/parameter-validation.exception';

/**
 * Interceptor that translates all thrown instances of ParameterValidationException into BadRequestException (thus generating a 400 HTTP error code result).  The resuting
 * BadRequestException has the ValidationError embedded by ParameterValidationException as its payload, which is embedded within an array (such as to be compliant with the same
 * contract as class-validator errors).  This interceptor is useful for cases where the inline business logic needs to throw validation exceptions that cannot be easily deduced by
 * the related request DTO alone.
 */
@Injectable()
export class ParameterValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    /* If any stacks that go through this inteceptor encounter a ParameterValidationException, we will translate that
     * value to a BadRequestException value so that a 400 is returned, and will supply the embedded validation error
     * instance as the exception's payload. */
    return next.handle().pipe(
      catchError(err => {
        let resultErr = err;

        if (err instanceof ParameterValidationException) {
          resultErr = new BadRequestException([err.validationError])
        }

        /* Throw the resulting exception as part of the observable pipeline, whatever that resulting exception may be. */
        return throwError(resultErr);
      })
    )
  }
}
