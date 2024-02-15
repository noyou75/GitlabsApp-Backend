import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../../common/request-context';
import { AnalyticsService } from '../../analytics/services/analytics.service';
import { CrudService } from '../../api/crud/crud.service';
import { PatientUser, User } from '../../../entities/user.entity';
import { AuthService } from '../../auth/auth.service';
import { ServiceAreaService } from '../../locale/service-area/service-area.service';
import { ContinueInsuranceOnMobileNotification } from '../../notification/notifications/continue-insurance-on-mobile.notification';
import { NotificationService } from '../../notification/services/notification.service';
import { OutOfServiceAreaEvent } from './patient-user-analytics.event';

@Injectable()
export class PatientUserService extends CrudService(PatientUser) {
  @Inject(forwardRef(() => AuthService))
  private readonly auth: AuthService;

  @Inject()
  private readonly notifications: NotificationService;

  @Inject()
  private readonly serviceArea: ServiceAreaService;

  @Inject()
  private readonly analyticsService: AnalyticsService;

  async sendContinueInsuranceOnMobileLink(user: PatientUser) {
    const key = await this.auth.generateKey(user, '/settings/insurance');
    await this.notifications.send(ContinueInsuranceOnMobileNotification, user, { key });
  }

  async update(entity: PatientUser, changes?: DeepPartial<PatientUser>, analyticsToken?: string): Promise<PatientUser> {
    /* Update the user's profile with the parent implementation of update */
    const user = await super.update(entity, changes, analyticsToken);

    /* Check the returned user object - if the user is not serviceable, we need to create an analytics event
     * that tracks this case. */
    if (user.address.zipCode && !(await this.serviceArea.isActive(user.address.zipCode))) {
      this.analyticsService.trackEvent(new OutOfServiceAreaEvent(user, RequestContext.get<User>(REQUEST_CONTEXT_USER)));
    }

    return user;
  }

  async create(entity: DeepPartial<PatientUser>, track = true, analyticsToken?: string) {
    /* When we create this user, determine if the supplied analytics token has referral data attached to it. */
    const referral = analyticsToken && (await this.analyticsService.getReferral(analyticsToken));
    entity.partnerReferral = referral ? [referral] : null;

    return await super.create(entity, track);
  }

  async getByReferralCode(referralCode: string): Promise<PatientUser> {
    /* This symbol is NOT deprecated - IntelliJ is picking up the method signature from a MongoDB typing def file instead of from the Repository
     * typing file, because IntelliJ. */
    return this.getRepository().findOne({ referralCode })
  }
}
