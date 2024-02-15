import { Injectable, OnModuleInit } from '@nestjs/common';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';
import { ModulesContainer } from '@nestjs/core/injector';
import { flattenDeep } from 'lodash';
import { every, someSeries } from 'p-iteration';
import { Connection } from 'typeorm';
import { inspect } from 'util';
import { className, ClassType } from '../../../common/class.utils';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { SecurityVoterOptions } from '../security/security-voter.decorator';
import { IVoter } from '../security/voter';
import { LoggerService } from './logger.service';
import { User } from '../../../entities/user.entity';

export const SECURITY_VOTER_METADATA = 'security-voter';

interface SecurityVoter {
  options: SecurityVoterOptions;
  instance: IVoter<any>;
}

@Injectable()
export class SecurityVoterService implements OnModuleInit {
  private voters: SecurityVoter[] = [];

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly connection: Connection,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    // Find all security voter services and add them to the voters registry

    const components = [...this.modulesContainer.values()].map(module => module.components);
    const voters = flattenDeep<SecurityVoter>(
      components.map(component =>
        [...component.values()]
          .filter(({ metatype }) => {
            return metatype && Reflect.hasMetadata(SECURITY_VOTER_METADATA, metatype);
          })
          .map(({ instance, metatype }) => {
            return {
              options: Reflect.getMetadata(SECURITY_VOTER_METADATA, metatype),
              instance,
            } as SecurityVoter;
          }),
      ),
    );

    this.voters = [...voters];
  }

  async isGranted<E>(type: ClassType<E> | string, subject: E, attrs: string | string[], user?: User, shallow?: boolean): Promise<boolean> {
    user = user || RequestContext.get<User>(REQUEST_CONTEXT_USER);

    if (!user) {
      throw new RuntimeException('No user available for grant check');
    }

    if (!this.connection.hasMetadata(type)) {
      throw new RuntimeException(`No metadata available for type ${type}: ${inspect(subject)}`);
    }

    const metadata = this.connection.getMetadata(type);

    attrs = Array.isArray(attrs) ? attrs : [attrs];
    if (!(await this.decideAffirmative(this.getVotersForType(type, attrs), subject, attrs, user))) {
      this.logger.log(
        'SecurityVoter->isGranted: %s to %s for %s => DENY',
        `${className(type)}:${metadata.getEntityIdMixedMap(subject)}`,
        `User:${user.id}`,
        `attrs:${attrs.join(',')}`,
      );

      return false;
    }

    this.logger.log(
      'SecurityVoter->isGranted: %s to %s for %s => ALLOW',
      `${className(type)}:${metadata.getEntityIdMixedMap(subject)}`,
      `User:${user.id}`,
      `attrs:${attrs.join(',')}`,
    );

    if (!shallow) {
      for (const relation of metadata.relations) {
        const relationObj = await Promise.resolve(relation.getEntityValue(subject));

        const entityMetadata = relation.inverseEntityMetadata;

        if (relationObj && entityMetadata.hasId(relationObj)) {
          if (!(await this.isGranted(entityMetadata.target, relationObj, attrs, user, false))) {
            return false;
          }
        }
      }
    }

    return true;
  }

  getVotersForType<E>(type: ClassType<E> | string, attrs: string | string[]): IVoter<E>[] {
    attrs = Array.isArray(attrs) ? attrs : [attrs];
    return this.voters
      .filter(voter => type === voter.options.type || (typeof type === 'string' && type === voter.options.type.name))
      .filter(voter => !voter.options.attrs || (voter.options.attrs && voter.options.attrs.filter(attr => attrs.includes(attr)).length > 0))
      .map(voter => voter.instance);
  }

  private async decideAffirmative<E>(voters: IVoter<E>[], subject: E, attrs: string[], user?: User): Promise<boolean> {
    this.logger.log(`SecurityVoter->decideAffirmative: Checking ${voters.length} voters => ${voters.map(voter => voter.constructor.name)}`);
    return someSeries(voters, async voter => await voter.vote(subject, attrs, user));
  }

  private async decideUnanimous<E>(voters: IVoter<E>[], subject: E, attrs: string[], user?: User): Promise<boolean> {
    return voters.length > 0 && every(voters, async voter => await voter.vote(subject, attrs, user));
  }
}
