import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { decode } from 'jsonwebtoken';
import { join } from 'path';
import request from 'supertest';
import { getConnection } from 'typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Token } from '../src/modules/auth/jwt/token.interface';
import { CoreModule } from '../src/modules/core/core.module';
import { FixturesService } from '../src/modules/core/services/fixtures.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const JWT_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;

  const codeDispatchedResp = { message: 'auth.code.dispatched' };
  const invalidCodeResp = { error: 'Unauthorized', message: 'auth.code.invalid', statusCode: 401 };
  const invalidUserResp = { error: 'Unauthorized', message: 'auth.user.invalid', statusCode: 401 };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(require('./ormconfig')), CoreModule, AuthModule],
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

  describe('CustomerUser', () => {
    const endpoint = '/auth';
    const username = '0000001111';

    it(`POST ${endpoint} (no code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(codeDispatchedResp);
    });

    // Skip until we add code to load fixtures
    it(`POST ${endpoint} (invalid code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
        code: '1234',
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual(invalidCodeResp);
    });

    it(`POST ${endpoint} (invalid user)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username: 'invalid',
        code: '1234',
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual(invalidUserResp);
    });

    it(`POST ${endpoint} (valid user & code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
        code: '0987',
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(JWT_REGEX); // JWT regex

      const payload: Token = decode(response.body.token, { json: true }) as Token;

      expect(payload.id).toBeDefined();
      expect(payload.type).toBe('CustomerUser');
    });
  });

  describe('Technician', () => {
    const endpoint = '/auth/specialist';
    const username = '0000002222';

    it(`POST ${endpoint} (no code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(codeDispatchedResp);
    });

    // Skip until we add code to load fixtures
    it(`POST ${endpoint} (invalid code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
        code: '1234',
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual(invalidCodeResp);
    });

    it(`POST ${endpoint} (invalid user)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username: 'invalid',
        code: '1234',
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual(invalidUserResp);
    });

    it(`POST ${endpoint} (valid user & code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
        code: '0987',
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(JWT_REGEX); // JWT regex

      const payload: Token = decode(response.body.token, { json: true }) as Token;

      expect(payload.id).toBeDefined();
      expect(payload.type).toBe('Technician');
    });
  });

  describe('StaffUser', () => {
    const endpoint = '/auth/staff';
    const username = '0000004444';

    it(`POST ${endpoint} (no code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(codeDispatchedResp);
    });

    // Skip until we add code to load fixtures
    it(`POST ${endpoint} (invalid code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
        code: '1234',
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual(invalidCodeResp);
    });

    it(`POST ${endpoint} (invalid user)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username: 'invalid',
        code: '1234',
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual(invalidUserResp);
    });

    it(`POST ${endpoint} (valid user & code)`, async () => {
      const response = await request(app.getHttpServer()).post(endpoint).send({
        username,
        code: '0987',
      });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(JWT_REGEX); // JWT regex

      const payload: Token = decode(response.body.token, { json: true }) as Token;

      expect(payload.id).toBeDefined();
      expect(payload.type).toBe('StaffUser');
    });
  });
});
