import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import request from 'supertest';
import { getConnection } from 'typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { CoreModule } from '../src/modules/core/core.module';
import { FixturesService } from '../src/modules/core/services/fixtures.service';
import { StaffUserModule } from '../src/modules/user/staff/staff-user.module';

describe('StaffUserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(require('./ormconfig')), CoreModule, AuthModule, StaffUserModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Sync and clear database
    await getConnection().synchronize(true);

    // Load test fixtures
    await app.get(FixturesService).load(join(__dirname, './fixtures'));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const endpoint = '/user/staff';

  it(`GET ${endpoint} (no auth)`, async () => {
    const response = await request(app.getHttpServer()).get(endpoint);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ statusCode: 401, error: 'Unauthorized' });
  });
});
