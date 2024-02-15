import { Injectable } from '@nestjs/common';
import HelloSign from 'hellosign-sdk';
import { DocumentType } from '../../../common/enums/document-type.enum';
import { SpecialistUser } from '../../../entities/user.entity';

@Injectable()
export class HelloSignService {
  client: HelloSign.Api;

  constructor(key: string, private clientId: string, private readonly types: { [value in DocumentType]?: string }) {
    this.client = HelloSign({ key });
  }

  async getSigningUrl(user: SpecialistUser, type: DocumentType): Promise<HelloSign.Embedded.Data> {
    let document = user.getDocument(type);

    if (!document || !document.signature) {
      const resp = await this.client.signatureRequest.createEmbeddedWithTemplate({
        test_mode: 1, // TODO: Get from production flag?
        clientId: this.clientId,
        template_id: this.getTemplateId(type),
        allow_decline: 0,
        signers: [
          {
            role: 'Specialist',
            name: user.name,
            email_address: user.email,
          },
        ],
        custom_fields: [
          {
            name: 'name',
            value: user.name,
            editor: 'Specialist',
            required: true,
          },
          {
            name: 'address1',
            value: user.address.street,
            editor: 'Specialist',
            required: true,
          },
          {
            name: 'address2',
            value: [user.address.city, user.address.state, user.address.zipCode].filter(Boolean).join(', '),
            editor: 'Specialist',
            required: true,
          },
        ],
      });

      user.updateDocument({
        type,
        signature: resp.signature_request.signatures[0].signature_id,
      });

      document = user.getDocument(type);
    }

    return (await this.client.embedded.getSignUrl(document.signature)).embedded;
  }

  private getTemplateId(type: DocumentType): string {
    if (!(type in this.types)) {
      throw new Error(`DocumentType of "${type}" is not a valid HelloSign document template`);
    }

    return this.types[type];
  }
}
