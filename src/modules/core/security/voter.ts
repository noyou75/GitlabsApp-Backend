import { Inject, Type } from '@nestjs/common';
import { someSeries } from 'p-iteration';
import { Connection, FindOneOptions, Repository } from 'typeorm';
import { className } from '../../../common/class.utils';
import { LoggerService } from '../services/logger.service';
import { User } from '../../../entities/user.entity';

export interface IVoter<E> {
  target: Type<E>;

  hasId(subject: any): boolean;

  getRepository(): Repository<E>;

  // TODO: Add distinction between preload and load, or remove preload all together

  preload(subject: any): Promise<E>;

  load(subject: E, options?: FindOneOptions): Promise<E>;

  vote(subject: any, attrs: string[], user: User);

  voteOnAttribute(subject: any, attr: string, user: User): Promise<boolean>;
}

export function Voter<E>(target: Type<E>): Type<IVoter<E>> {
  class VoterHost {
    @Inject()
    private readonly logger: LoggerService;

    @Inject()
    private readonly connection: Connection;

    target = target;

    hasId(subject: any): boolean {
      return this.connection.getMetadata(target).hasAllPrimaryKeys(subject);
    }

    getRepository(): Repository<E> {
      return this.connection.getRepository(target);
    }

    async preload(subject: any): Promise<E> {
      return this.hasId(subject) && !(subject instanceof target) ? await this.getRepository().preload(subject) : subject;
    }

    async load(subject: E, options?: FindOneOptions<E>): Promise<E> {
      const repo = this.getRepository();
      return this.hasId(subject) ? await repo.findOne(repo.getId(subject), options) : subject;
    }

    async vote(subject: any, attrs: string[], user: User) {
      return someSeries(attrs, async attr => {
        const result = await this.voteOnAttribute(subject, attr, user);
        this.logger.log(`Voter->vote: Checking ${className(this)} voter attr:${attr} => ${result ? 'ALLOW' : 'DENY'}`);
        return result;
      });
    }

    async voteOnAttribute(subject: any, attr: string, user: User): Promise<boolean> {
      throw new Error('Method "voteOnAttribute" not implemented.');
    }
  }

  return VoterHost;
}
