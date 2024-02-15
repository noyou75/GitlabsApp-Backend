import { addDays, subDays } from 'date-fns';
import 'reflect-metadata';
import { SpecialistUser } from '../../../entities/user.entity';

describe('SpecialistUser', () => {
  it('should be active when no deactivation date set', () => {
    const user = new SpecialistUser();
    expect(user.isActive()).toBe(true);
  });

  it('should be active when deactivation date is in the future', () => {
    const user = new SpecialistUser();
    user.deactivationDate = addDays(new Date(), 1);
    expect(user.isActive()).toBe(true);
  });

  it('should be inactive when deactivation date is now', () => {
    const user = new SpecialistUser();
    user.deactivationDate = new Date();
    expect(user.isActive()).toBe(false);
  });

  it('should be inactive when deactivation date is in the past', () => {
    const user = new SpecialistUser();
    user.deactivationDate = subDays(new Date(), 1);
    expect(user.isActive()).toBe(false);
  });
});
