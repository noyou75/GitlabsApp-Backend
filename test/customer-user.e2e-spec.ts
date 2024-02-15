import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import request from 'supertest';
import { getConnection } from 'typeorm';
import { StaffUser } from '../src/entities/user.entity';
import { AuthModule } from '../src/modules/auth/auth.module';
import { CoreModule } from '../src/modules/core/core.module';
import { FixturesService } from '../src/modules/core/services/fixtures.service';
import { PatientUserModule } from '../src/modules/user/patient/patient-user.module';

import { AuthenticateAsService } from './services/auth-as.service';

describe('CustomerUserController (e2e)', () => {
  let app: INestApplication;
  let auth: AuthenticateAsService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(require('./ormconfig')), CoreModule, AuthModule, PatientUserModule],
      providers: [AuthenticateAsService],
    }).compile();

    app = moduleFixture.createNestApplication();

    auth = app.get(AuthenticateAsService);

    // Sync and clear database
    await getConnection().synchronize(true);

    // Load test fixtures
    await app.get(FixturesService).load(join(__dirname, './fixtures'));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const endpoint = '/user/customer';

  it(`GET ${endpoint} (no auth)`, async () => {
    const response = await request(app.getHttpServer()).get(endpoint);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ statusCode: 401, error: 'Unauthorized' });
  });

  it(`GET ${endpoint}`, async () => {
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .use(await auth.authenticateAs(StaffUser, '0000004444'));
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});
