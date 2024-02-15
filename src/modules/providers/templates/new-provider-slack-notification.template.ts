import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { loadFile } from '../../../common/file.utils';
import { defaultTemplateRuntimeOptions } from '../../../common/template.utils';
import { Template } from '../../templating/template';
import { Provider } from '../dto/provider';

@Injectable()
export class NewProviderSlackNotificationTemplate implements Template {
  private readonly html: Handlebars.TemplateDelegate;

  constructor() {
    this.html = Handlebars.compile(loadFile('views/slack/new-provider.hbs'));
  }

  async render(params?: { [k: string]: any }): Promise<string> {
    if (!(params.provider instanceof Provider)) {
      throw new TypeError("Template parameter 'provider' must be an instance of Provider");
    }

    return this.html(params, defaultTemplateRuntimeOptions);
  }
}
