import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { map } from 'p-iteration';
import { LabCompany } from 'src/common/enums/lab-company.enum';
import { getLabName } from 'src/common/lab.utils';
import { loadFile, mimeType, scaleImageToFit } from '../../../common/file.utils';
import { defaultTemplateRuntimeOptions } from '../../../common/template.utils';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { FileEntity } from '../../../entities/file.entity';
import { LabOrderDetailsEntity } from '../../../entities/lab-order-details.entity';
import { PdfService } from '../../core/services/pdf.service';
import { FileService } from '../../file/file.service';
import { Template } from '../template';

@Injectable()
export class LabDropOffFormTemplate implements Template {
  private readonly html: Handlebars.TemplateDelegate;

  private readonly params: { [k: string]: any };

  constructor(private readonly fileService: FileService, private readonly pdfService: PdfService) {
    this.html = Handlebars.compile(loadFile('views/bookings/lab-drop-off-form.hbs'));

    this.params = {
      logo: `data:image/svg+xml;base64,${loadFile('views/bookings/getlabs-logo.svg', 'base64')}`,
    };
  }

  async render(params?: { [k: string]: any }): Promise<string> {
    if (!(params.appointment instanceof AppointmentEntity)) {
      throw new TypeError("Template parameter 'appointment' must be an instance of Booking");
    }

    const appointment = params.appointment;

    params = {
      ...this.params,
      labOrders: await Promise.all(
        appointment.labOrderDetails
          .filter((lod) => !lod.isDeleted)
          .map((lod) => {
            return Promise.all([
              this.getLabOrderDocuments(lod),
              appointment.patient.insurance.front ? this.downloadImageToDataUri(appointment.patient.insurance.front) : null,
              appointment.patient.insurance.rear ? this.downloadImageToDataUri(appointment.patient.insurance.rear) : null,
            ]).then((files) => {
              return {
                labOrderDocuments: files[0],
                insurance: {
                  front: files[1],
                  rear: files[2],
                },
                labOrderDetails: lod,
              };
            });
          }),
      ),
      labAccountCode: (appointment.patient.address?.serviceArea.market.labAccountCodes ?? [])
        .filter((code) => code.company == appointment.labLocation.lab)
        .map((code) => {
          const company = code.company == LabCompany.Labcorp ? getLabName(code.company) + ' Vendor' : getLabName(code.company) + ' Account';
          return {
            company: company,
            accountNumber: code.accountNumber,
          };
        }),
      ...params,
    };

    return this.html(params, defaultTemplateRuntimeOptions);
  }

  private async getLabOrderDocuments(labOrderDetails: LabOrderDetailsEntity) {
    return {
      labOrderPages: labOrderDetails.labOrderFiles ? await this.downloadPdfToDataUris(labOrderDetails.labOrderFiles) : [],
      abnDocumentPages: labOrderDetails.abnDocument ? await this.downloadPdfToDataUris([labOrderDetails.abnDocument]) : [],
      accuDrawPages: labOrderDetails.accuDraw ? await this.downloadPdfToDataUris([labOrderDetails.accuDraw]) : [],
    };
  }

  async downloadImageToDataUri(file: FileEntity): Promise<string> {
    // Ensure it's actually an image to limit any potential attack vectors
    if (!file.isImage()) {
      return '';
    }

    // Let the browser download the images directly via a signed URL, rather than generating a data URI
    return await this.fileService.getSignedUrl(file);

    // const image = await scaleImageToFit(await this.fileService.download(file), 300 * 8, 300 * 11);
    // const image = await this.fileService.download(file);
    // return `data:${file.type};base64,${image.toString('base64')}`;
  }

  async downloadPdfToDataUris(files: Array<FileEntity>): Promise<string[]> {
    const result: string[] = [];

    for (let i = 0; i < (files?.length || 0); i++) {
      if (files[i].isImage()) {
        result.push(await this.downloadImageToDataUri(files[i]));
      }

      // Ensure it's actually a pdf to limit any potential attack vectors
      else if (files[i].isPDF()) {
        const start1 = new Date();
        const buffer = await this.fileService.download(files[i]);
        const end1 = +new Date() - +start1;
        const start2 = new Date();
        const images = await this.pdfService.toImages(buffer);
        const end2 = +new Date() - +start2;
        const end3 = +new Date() - +start1;

        console.info('File size: ', files[i].size);
        console.info('Download time: %dms', end1);
        console.info('Buffer to Images time: %dms', end2);
        console.info('Total PDF to Images time: %dms', end3);
        // console.info('Resolution: ', images[0].)

        await map(images, async (image) => {
          image = await scaleImageToFit(image, 300 * 8, 300 * 11, true);
          return result.push(`data:${(await mimeType(image)).mime};base64,${image.toString('base64')}`);
        });
      }
    }

    return result;
  }
}
