import { OnModuleInit } from '@nestjs/common';
import { AbstractJobSchedulerService } from '../services/abstract-job-scheduler.service';

/**
 * Internal interface that defines the registration type for job scheduler registrations.
 * propertyName corresponds to the name of the property containing the scheduler service inside of the
 * consuming class; domain refers to the functional domain with which the service consumer has registered
 * their instance of the scheduler.
 */
interface JobSchedulerDefinition {
  propertyName: string | symbol;
  domain: string;
  target: object;
}

/**
 * All registered classes & properties are stored in this structure.
 */
const properties: {
  [key: string]: JobSchedulerDefinition;
} = {};

/**
 * Class-level annotation that identifies a class that consumes a job scheduler.
 */
export function JobScheduleInterface() {
  return function _JobSchedulerInterface<T extends new (...args: any[]) => {}>(constr: T) {
    return class extends constr implements OnModuleInit {
      onModuleInit(): any {
        /* See if any metadata exists for this class... */
        Object.values(properties).forEach((jobSchedulerDefinition) => {
          /* For each metadata, set the domain descriptor that corresponds to the indicated property */
          if (jobSchedulerDefinition.target.constructor.name === super.constructor.name) {
            (this[jobSchedulerDefinition.propertyName] as AbstractJobSchedulerService).setDomainDescriptorKey(
              getKey(super.constructor.name, jobSchedulerDefinition.propertyName),
            );
          }
        });

        /* If the decorated class implements OnModuleInit, invoke that now. */
        super['onModuleInit'] && super['onModuleInit']();
      }
    };
  };
}

/**
 * Retrieves the job scheduler interface metadata key that corresponds to the supplied class and
 * property names.
 */
const getKey = (className: string, propertyName: string | symbol) => {
  return `${className}#${String(propertyName)}`;
};

/**
 * Property-level annotation that identifies the property within the consuming class that contains the
 * scheduler.
 */
export function JobDomain(domain: string): (target: any, propertyName: string | symbol) => void {
  return (target: object, propertyName: string | symbol) => {
    properties[getKey(target.constructor.name, propertyName)] = {
      target,
      propertyName,
      domain,
    };
  };
}

/**
 * Static manager class that allows framework code to access domain metadata for a given key.
 */
export class JobDomainManager {
  public static getDomain(key: string) {
    return properties[key] && properties[key].domain;
  }
}
