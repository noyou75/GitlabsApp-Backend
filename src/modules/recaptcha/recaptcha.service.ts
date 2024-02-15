import { HttpService, Inject, Injectable } from '@nestjs/common';
import { HttpClient } from '../../common/http-client';
import { RecaptchaConfig } from '../core/enums/config.enum';
import { ConfigService } from '../core/services/config.service';
import { LoggerService } from '../core/services/logger.service';

/**
 * The primary interface through which consumers can interact with Google Recaptcha.  Consumers may use this
 * service to validate recaptcha tokens received from the front end client.
 */
@Injectable()
export class RecaptchaService {
  private readonly httpClient: HttpClient;

  private readonly endpoint = 'https://www.google.com/recaptcha/api/siteverify';

  constructor(private readonly httpService: HttpService, private readonly config: ConfigService, private readonly logger: LoggerService) {
    this.httpClient = new HttpClient(httpService, {
      baseURL: this.endpoint,
    });
  }

  /**
   * Validates the supplied recaptcha token, which should have been dispatched by the front end.
   */
  public async validateRecaptchaToken(token: string) {
    const obs = this.httpClient.post<any>(this.endpoint, null, {
      params: {
        secret: this.config.get(RecaptchaConfig.Secret),
        response: token,
      },
    });
    const resp = await obs.toPromise();

    const threshold = this.config.get(RecaptchaConfig.ScoreThreshold);

    const result = resp.data.success && resp.data.score >= threshold;

    if (!result) {
      this.logger.info(
        `Recaptcha token validation failed - result: ${resp.data.success}; score: ${resp.data.score}; threshold: ${threshold}`,
      );
    }

    return result;
  }
}
