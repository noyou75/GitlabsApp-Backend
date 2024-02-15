import { PeerReferralEntity } from '../../../entities/peer-referral.entity';
import { PatientUser } from '../../../entities/user.entity';
import { CrudService } from '../../api/crud/crud.service';

export class PeerReferralService extends CrudService(PeerReferralEntity) {
  getPeerReferral(user: PatientUser) {
    /* Not deprecated.  Nice one, IntelliJ. */
    return this.getRepository().findOne({
      referree: user,
    });
  }
}
