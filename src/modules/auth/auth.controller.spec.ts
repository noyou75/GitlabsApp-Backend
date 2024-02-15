import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PatientUser, SpecialistUser, StaffUser } from '../../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenDto } from './dto/auth-token.dto';
import { AuthDto } from './dto/auth.dto';

jest.mock('./auth.service');

describe('Auth Controller', () => {
  let module: TestingModule;
  let controller: AuthController;
  let service: AuthService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();
    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('patient()', () => {
    it('should request a code when only username is provided', async () => {
      const requestCode = jest.spyOn(service, 'generateCode');

      expect(await controller.patient({ username: 'patient' })).toEqual(new AuthTokenDto(undefined, 'auth.code.dispatched'));
      expect(requestCode).toHaveBeenCalledWith('patient');

      expect(await controller.specialist({ username: 'specialist' })).toEqual(new AuthTokenDto(undefined, 'auth.code.dispatched'));
      expect(requestCode).toHaveBeenCalledWith('specialist');

      expect(await controller.staff({ username: 'staff' })).toEqual(new AuthTokenDto(undefined, 'auth.code.dispatched'));
      expect(requestCode).toHaveBeenCalledWith('staff');
    });

    it('should return a token when a valid username and code are provided', async () => {
      const signInWithAuthCode = jest.spyOn(service, 'signInWithCode').mockReturnValue(Promise.resolve('token'));

      expect(await controller.patient({ username: 'patient', code: '1234' })).toEqual(new AuthTokenDto('token'));
      expect(signInWithAuthCode).toHaveBeenCalledWith(PatientUser, 'patient', '1234');

      expect(await controller.specialist({ username: 'specialist', code: '1234' })).toEqual(new AuthTokenDto('token'));
      expect(signInWithAuthCode).toHaveBeenCalledWith(SpecialistUser, 'specialist', '1234');

      expect(await controller.staff({ username: 'staff', code: '1234' })).toEqual(new AuthTokenDto('token'));
      expect(signInWithAuthCode).toHaveBeenCalledWith(StaffUser, 'staff', '1234');
    });

    it('should return a token when a valid username and password are provided', async () => {
      const signInWithPassword = jest.spyOn(service, 'signInWithPassword').mockReturnValue(Promise.resolve('token'));

      expect(await controller.patient({ username: 'patient', password: 'password' })).toEqual(new AuthTokenDto('token'));
      expect(signInWithPassword).toHaveBeenCalledWith(PatientUser, 'patient', 'password');

      expect(await controller.specialist({ username: 'specialist', password: 'password' })).toEqual(new AuthTokenDto('token'));
      expect(signInWithPassword).toHaveBeenCalledWith(SpecialistUser, 'specialist', 'password');

      expect(await controller.staff({ username: 'staff', password: 'password' })).toEqual(new AuthTokenDto('token'));
      expect(signInWithPassword).toHaveBeenCalledWith(StaffUser, 'staff', 'password');
    });

    it('should throw an exception when neither username or code are provided', async () => {
      await expect(controller.patient({} as AuthDto)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(controller.specialist({} as AuthDto)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(controller.staff({} as AuthDto)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
