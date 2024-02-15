import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { FileEntity } from '../../entities/file.entity';
import { CrudController } from '../api/crud/crud.controller';
import { RolesGuard } from '../auth/roles.guard';
import { SECURITY_ATTR_MODIFY } from '../core/security/security-voter.const';
import { LoggerService } from '../core/services/logger.service';
import { DownloadOptionsDto } from './dto/DownloadOptionsDto';
import { FileService } from './file.service';
import { ConvertToEntity } from '../shared/decorators/convert-to-entity.decorator';

const BaseController = CrudController(FileEntity, FileService, {
  findOneOptions: {
    relations: ['thumbnail'],
  },
});

@Controller('file')
@UseGuards(AuthGuard(), RolesGuard)
export class FileController extends BaseController {
  @Inject()
  private readonly logger: LoggerService;

  @Get(':id/download')
  async download(
    @ConvertToEntity({ type: FileEntity }) entity: FileEntity,
    @Query() query: DownloadOptionsDto,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.read(entity);

    if (!(await this.service.exists(file))) {
      throw new InternalServerErrorException(`File does not exist in storage service!`);
    }

    res.writeHead(200, {
      'Content-Type': file.type,
      'Content-Length': file.size,
      'Content-Disposition': query.inline ? 'inline' : `attachment; filename="${file.name}"`,
    });

    this.service
      .stream(file)
      .on('error', (err) => {
        this.logger.error(err.message);
        res.end();
      })
      .pipe(res);
  }

  /**
   * Rotates the image described by the supplied ID by the supplied number of degrees.
   */
  @Post(':id/rotate/:degrees')
  async rotate(@ConvertToEntity({ type: FileEntity }) entity: FileEntity, @Param('degrees', new ParseIntPipe()) degrees: number) {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY);

    try {
      return await this.service.rotate(entity, degrees);
    } catch (err) {
      /* If the rotate operation results in an error, it was likely due to a bad file being specified here. */
      throw new BadRequestException(`The rotate operation failed due to an exception: ${err}`, err);
    }
  }
}
