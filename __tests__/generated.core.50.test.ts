import { Request, Response } from 'express';

jest.mock('../src/features/auth/entity/user.model', () => {
  const mockUserModel = {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  };

  return {
    UserModel: mockUserModel,
  };
});

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

jest.mock('crypto', () => ({
  __esModule: true,
  default: {
    randomBytes: jest.fn(),
  },
}));

jest.mock('../src/common/utils/email.helper', () => ({
  sendEmail: jest.fn(),
}));

import authController from '../src/features/auth/controller/auth.controller';
import { AuthService } from '../src/features/auth/service/auth.service';
import { getAllUsers, deleteUser } from '../src/features/user/user.controller';
import { UserRepository } from '../src/features/auth/repository/user.repository';
import { UserModel } from '../src/features/auth/entity/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../src/common/utils/email.helper';

const mockedUserModel = UserModel as unknown as {
  find: jest.Mock;
  create: jest.Mock;
  findById: jest.Mock;
  countDocuments: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findOne: jest.Mock;
};

const mockedBcrypt = bcrypt as unknown as { hash: jest.Mock; compare: jest.Mock };
const mockedJwt = jwt as unknown as { sign: jest.Mock; verify: jest.Mock };
const mockedCrypto = crypto as unknown as { randomBytes: jest.Mock };
const mockedSendEmail = sendEmail as jest.Mock;

const createMockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Controllers: auth.controller + user.controller', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('register returns 201 with service result', async () => {
    const req = { body: { email: 'a@b.com', password: 'pw' } } as Request;
    const res = createMockRes();
    const payload = { success: true, message: 'ok' };

    jest.spyOn(AuthService.prototype, 'register').mockResolvedValue(payload as any);
    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('register returns 400 when service throws', async () => {
    const req = { body: { email: 'x@x.com' } } as Request;
    const res = createMockRes();

    jest.spyOn(AuthService.prototype, 'register').mockRejectedValue(new Error('Bad input'));
    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('login returns 200 with tokens', async () => {
    const req = { body: { email: 'a@b.com', password: 'pw' } } as Request;
    const res = createMockRes();
    const payload = { accessToken: 'a', refreshToken: 'r' };

    jest.spyOn(AuthService.prototype, 'login').mockResolvedValue(payload as any);
    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('login returns 401 when credentials are invalid', async () => {
    const req = { body: { email: 'a@b.com', password: 'wrong' } } as Request;
    const res = createMockRes();

    jest.spyOn(AuthService.prototype, 'login').mockRejectedValue(new Error('Invalid credentials'));
    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('refresh returns 400 if refreshToken is missing', async () => {
    const req = { body: {} } as Request;
    const res = createMockRes();

    await authController.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Refresh token is required' });
  });

  it('refresh returns 200 with renewed tokens', async () => {
    const req = { body: { refreshToken: 'valid-refresh' } } as Request;
    const res = createMockRes();
    const payload = { accessToken: 'new-a', refreshToken: 'new-r' };

    jest.spyOn(AuthService.prototype, 'refreshTokens').mockResolvedValue(payload);
    await authController.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('refresh returns 401 when token verification fails', async () => {
    const req = { body: { refreshToken: 'bad' } } as Request;
    const res = createMockRes();

    jest.spyOn(AuthService.prototype, 'refreshTokens').mockRejectedValue(new Error('Invalid refresh token'));
    await authController.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('auth getAllUsers returns 200 with users list', async () => {
    const req = {} as Request;
    const res = createMockRes();
    const users = [{ id: '1', email: 'u@u.com' }];

    jest.spyOn(AuthService.prototype, 'getAllUsers').mockResolvedValue(users as any);
    await authController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: users });
  });

  it('auth getAllUsers returns 500 on service failure', async () => {
    const req = {} as Request;
    const res = createMockRes();

    jest.spyOn(AuthService.prototype, 'getAllUsers').mockRejectedValue(new Error('DB failed'));
    await authController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('user controller getAllUsers returns paginated response', async () => {
    const req = { query: { page: '2', limit: '3' } } as unknown as Request;
    const res = createMockRes();

    const sort = jest.fn().mockResolvedValue([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]);
    const limit = jest.fn().mockReturnValue({ sort });
    const skip = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ skip });

    mockedUserModel.find.mockReturnValue({ select });
    mockedUserModel.countDocuments.mockResolvedValue(7);

    await getAllUsers(req, res);

    expect(skip).toHaveBeenCalledWith(3);
    expect(limit).toHaveBeenCalledWith(3);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('user controller getAllUsers default page/limit are applied', async () => {
    const req = { query: {} } as unknown as Request;
    const res = createMockRes();

    const sort = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ sort });
    const skip = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ skip });

    mockedUserModel.find.mockReturnValue({ select });
    mockedUserModel.countDocuments.mockResolvedValue(0);

    await getAllUsers(req, res);

    expect(skip).toHaveBeenCalledWith(0);
    expect(limit).toHaveBeenCalledWith(10);
  });

  it('user controller getAllUsers handles non-numeric query with defaults', async () => {
    const req = { query: { page: 'abc', limit: 'xyz' } } as unknown as Request;
    const res = createMockRes();

    const sort = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ sort });
    const skip = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ skip });

    mockedUserModel.find.mockReturnValue({ select });
    mockedUserModel.countDocuments.mockResolvedValue(2);

    await getAllUsers(req, res);

    expect(skip).toHaveBeenCalledWith(0);
    expect(limit).toHaveBeenCalledWith(10);
  });

  it('user controller getAllUsers computes totalPages properly', async () => {
    const req = { query: { page: '1', limit: '4' } } as unknown as Request;
    const res = createMockRes();

    const sort = jest.fn().mockResolvedValue([{}, {}, {}, {}]);
    const limit = jest.fn().mockReturnValue({ sort });
    const skip = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ skip });

    mockedUserModel.find.mockReturnValue({ select });
    mockedUserModel.countDocuments.mockResolvedValue(9);

    await getAllUsers(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      pagination: expect.objectContaining({ totalPages: 3 }),
    }));
  });

  it('user controller getAllUsers returns 500 when model throws', async () => {
    const req = { query: { page: '1', limit: '5' } } as unknown as Request;
    const res = createMockRes();

    mockedUserModel.find.mockImplementation(() => {
      throw new Error('query failed');
    });

    await getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('user controller deleteUser returns 200 on successful delete', async () => {
    const req = { params: { id: 'u1' } } as unknown as Request;
    const res = createMockRes();

    mockedUserModel.findByIdAndDelete.mockResolvedValue({ id: 'u1' });
    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('user controller deleteUser returns 404 if user not found', async () => {
    const req = { params: { id: 'missing' } } as unknown as Request;
    const res = createMockRes();

    mockedUserModel.findByIdAndDelete.mockResolvedValue(null);
    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('user controller deleteUser returns 500 when deletion fails', async () => {
    const req = { params: { id: 'u1' } } as unknown as Request;
    const res = createMockRes();

    mockedUserModel.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));
    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Service/business logic: AuthService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('register throws when email already exists', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue({ id: 'x' } as any);

    await expect(service.register({ name: 'N', email: 'a@b.com', password: 'pw', role: 'user' } as any))
      .rejects
      .toThrow('Email already in use');
  });

  it('register hashes password and creates user', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed_pw');
    jest.spyOn(UserRepository.prototype, 'create').mockResolvedValue({
      id: 'u1',
      name: 'Neo',
      email: 'neo@matrix.ai',
      role: 'user',
      password: 'hashed_pw',
    } as any);
    mockedJwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    const result = await service.register({ name: 'Neo', email: 'neo@matrix.ai', password: 'pw', role: 'user' } as any);

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('pw', 10);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('register defaults role to user when absent', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed_pw');
    const createSpy = jest.spyOn(UserRepository.prototype, 'create').mockResolvedValue({
      id: 'u1', name: 'Neo', email: 'neo@x.com', role: 'user', password: 'hashed_pw',
    } as any);
    mockedJwt.sign.mockReturnValueOnce('a').mockReturnValueOnce('r');

    await service.register({ name: 'Neo', email: 'neo@x.com', password: 'pw' } as any);

    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ role: 'user' }));
  });

  it('register response includes safe mapped user object', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue('hashed_pw');
    jest.spyOn(UserRepository.prototype, 'create').mockResolvedValue({
      id: 'u1', name: 'Neo', email: 'neo@x.com', role: 'user', password: 'hashed_pw', phoneNumber: '1',
    } as any);
    mockedJwt.sign.mockReturnValueOnce('a').mockReturnValueOnce('r');

    const result = await service.register({ name: 'Neo', email: 'neo@x.com', password: 'pw' } as any);

    expect(result.user).toEqual(expect.objectContaining({ id: 'u1', email: 'neo@x.com' }));
    expect((result.user as any).password).toBeUndefined();
  });

  it('login throws when user is not found', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue(null);

    await expect(service.login({ email: 'none@x.com', password: 'pw' } as any)).rejects.toThrow('Invalid credentials');
  });

  it('login throws when password does not match', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue({ id: 'u1', email: 'x@x.com', password: 'storedHash', role: 'user', name: 'X' } as any);
    mockedBcrypt.compare.mockResolvedValue(false);

    await expect(service.login({ email: 'x@x.com', password: 'wrong' } as any)).rejects.toThrow('Invalid credentials');
  });

  it('login returns user + tokens on valid credentials', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue({ id: 'u2', name: 'Trinity', email: 'tri@x.com', password: 'storedHash', role: 'admin' } as any);
    mockedBcrypt.compare.mockResolvedValue(true);
    mockedJwt.sign.mockReturnValueOnce('access-2').mockReturnValueOnce('refresh-2');

    const result = await service.login({ email: 'tri@x.com', password: 'pw' } as any);

    expect(result.user.email).toBe('tri@x.com');
    expect(result.accessToken).toBe('access-2');
  });

  it('login access token includes role payload via jwt.sign', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue({ id: 'u2', name: 'Trinity', email: 'tri@x.com', password: 'storedHash', role: 'admin' } as any);
    mockedBcrypt.compare.mockResolvedValue(true);
    mockedJwt.sign.mockReturnValueOnce('access-2').mockReturnValueOnce('refresh-2');

    await service.login({ email: 'tri@x.com', password: 'pw' } as any);

    expect(mockedJwt.sign).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'u2', role: 'admin' }), expect.any(String), expect.any(Object));
  });

  it('refreshTokens returns new tokens', async () => {
    const service = new AuthService();
    mockedJwt.verify.mockReturnValue({ id: 'u9' });
    mockedJwt.sign.mockReturnValueOnce('new-access').mockReturnValueOnce('new-refresh');

    const result = await service.refreshTokens('valid-r');

    expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  });

  it('refreshTokens verifies refresh token with secret', async () => {
    const service = new AuthService();
    mockedJwt.verify.mockReturnValue({ id: 'u9' });
    mockedJwt.sign.mockReturnValueOnce('new-access').mockReturnValueOnce('new-refresh');

    await service.refreshTokens('valid-r');

    expect(mockedJwt.verify).toHaveBeenCalledWith('valid-r', expect.any(String));
  });

  it('refreshTokens throws on invalid refresh token', async () => {
    const service = new AuthService();
    mockedJwt.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await expect(service.refreshTokens('bad-r')).rejects.toThrow('Invalid refresh token');
  });

  it('getAllUsers maps repository users to safe response shape', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findAll').mockResolvedValue([
      { id: '1', name: 'A', email: 'a@a.com', role: 'user', createdAt: new Date('2026-01-01') },
      { id: '2', name: 'B', email: 'b@b.com', role: 'admin', createdAt: new Date('2026-01-02') },
    ] as any);

    const users = await service.getAllUsers();

    expect(users).toHaveLength(2);
    expect(users[0]).toHaveProperty('createdAt');
  });

  it('getAllUsers returns empty list when repository is empty', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findAll').mockResolvedValue([] as any);

    const users = await service.getAllUsers();

    expect(users).toEqual([]);
  });

  it('forgotPassword returns early when email does not exist', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue(null);

    await service.forgotPassword('missing@x.com');

    expect(mockedUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('forgotPassword stores reset token and sends email', async () => {
    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue({ id: 'u3', email: 'u3@x.com' } as any);
    mockedCrypto.randomBytes.mockReturnValue({ toString: jest.fn().mockReturnValue('reset-token') } as any);
    mockedUserModel.findByIdAndUpdate.mockResolvedValue({});

    await service.forgotPassword('u3@x.com');

    expect(mockedUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u3', expect.objectContaining({ resetPasswordToken: 'reset-token' }));
    expect(mockedSendEmail).toHaveBeenCalled();
  });

  it('forgotPassword uses default frontend URL when FRONTEND_URL missing', async () => {
    const oldFront = process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URL;

    const service = new AuthService();
    jest.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue({ id: 'u3', email: 'u3@x.com' } as any);
    mockedCrypto.randomBytes.mockReturnValue({ toString: jest.fn().mockReturnValue('reset-token') } as any);
    mockedUserModel.findByIdAndUpdate.mockResolvedValue({});

    await service.forgotPassword('u3@x.com');

    expect(mockedSendEmail).toHaveBeenCalledWith('u3@x.com', 'Password Reset Request', expect.stringContaining('http://localhost:3000/reset-password?token=reset-token'));

    process.env.FRONTEND_URL = oldFront;
  });

  it('resetPassword throws if token is not found anywhere', async () => {
    const service = new AuthService();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedUserModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(service.resetPassword('unknown', 'new-pw')).rejects.toThrow('Invalid or expired token');

    consoleSpy.mockRestore();
  });

  it('resetPassword throws token-expired error when token exists but expired', async () => {
    const service = new AuthService();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedUserModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ resetPasswordExpires: Date.now() - 1000 });

    await expect(service.resetPassword('expired-token', 'new-pw')).rejects.toThrow('Token expired. Please request a new password reset.');

    consoleSpy.mockRestore();
  });

  it('resetPassword throws generic invalid when unknown reason branch is hit', async () => {
    const service = new AuthService();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedUserModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ resetPasswordExpires: Date.now() + 999999 });

    await expect(service.resetPassword('weird-token', 'new-pw')).rejects.toThrow('Invalid or expired token');

    consoleSpy.mockRestore();
  });

  it('resetPassword hashes new password and saves user', async () => {
    const service = new AuthService();
    const save = jest.fn().mockResolvedValue(undefined);
    const userDoc: any = { password: 'old', resetPasswordToken: 'token', resetPasswordExpires: Date.now() + 1000, save };

    mockedUserModel.findOne.mockResolvedValue(userDoc);
    mockedBcrypt.hash.mockResolvedValue('new-hash');

    await service.resetPassword('valid-token', 'new-password');

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('new-password', 10);
    expect(save).toHaveBeenCalled();
  });

  it('resetPassword clears reset token fields', async () => {
    const service = new AuthService();
    const userDoc: any = { password: 'old', resetPasswordToken: 'token', resetPasswordExpires: Date.now() + 1000, save: jest.fn().mockResolvedValue(undefined) };

    mockedUserModel.findOne.mockResolvedValue(userDoc);
    mockedBcrypt.hash.mockResolvedValue('new-hash');

    await service.resetPassword('valid-token', 'new-password');

    expect(userDoc.resetPasswordToken).toBeUndefined();
    expect(userDoc.resetPasswordExpires).toBeUndefined();
  });
});

describe('Database interaction wrapper: UserRepository', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('findByEmail delegates query to model.findOne', async () => {
    mockedUserModel.findOne.mockResolvedValue({ id: 'u1' });
    const repo = new UserRepository();

    const result = await repo.findByEmail('x@y.com');

    expect(mockedUserModel.findOne).toHaveBeenCalledWith({ email: 'x@y.com' });
    expect(result).toEqual({ id: 'u1' });
  });

  it('create delegates to model.create', async () => {
    mockedUserModel.create.mockResolvedValue({ id: 'u2', email: 'new@x.com' });
    const repo = new UserRepository();

    const result = await repo.create({ name: 'N', email: 'new@x.com', password: 'h' });

    expect(mockedUserModel.create).toHaveBeenCalledWith({ name: 'N', email: 'new@x.com', password: 'h' });
    expect(result).toEqual({ id: 'u2', email: 'new@x.com' });
  });

  it('findById delegates to model.findById', async () => {
    mockedUserModel.findById.mockResolvedValue({ id: 'u3' });
    const repo = new UserRepository();

    const result = await repo.findById('u3');

    expect(mockedUserModel.findById).toHaveBeenCalledWith('u3');
    expect(result).toEqual({ id: 'u3' });
  });

  it('update delegates to model.findByIdAndUpdate with new:true', async () => {
    mockedUserModel.findByIdAndUpdate.mockResolvedValue({ id: 'u1', name: 'updated' });
    const repo = new UserRepository();

    const result = await repo.update('u1', { name: 'updated' } as any);

    expect(mockedUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', { name: 'updated' }, { new: true });
    expect(result).toEqual({ id: 'u1', name: 'updated' });
  });

  it('update returns null when no document is updated', async () => {
    mockedUserModel.findByIdAndUpdate.mockResolvedValue(null);
    const repo = new UserRepository();

    const result = await repo.update('missing', { name: 'updated' } as any);

    expect(result).toBeNull();
  });

  it('findAll delegates to model.find().sort({createdAt:-1})', async () => {
    const sort = jest.fn().mockResolvedValue([{ id: 'u1' }]);
    mockedUserModel.find.mockReturnValue({ sort });
    const repo = new UserRepository();

    const result = await repo.findAll();

    expect(mockedUserModel.find).toHaveBeenCalled();
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('findAll returns empty array when no users exist', async () => {
    const sort = jest.fn().mockResolvedValue([]);
    mockedUserModel.find.mockReturnValue({ sort });
    const repo = new UserRepository();

    const result = await repo.findAll();

    expect(result).toEqual([]);
  });
});
