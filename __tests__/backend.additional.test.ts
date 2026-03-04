jest.mock('../src/features/auth/entity/user.model', () => ({
  UserModel: {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

import nodemailer from 'nodemailer';
import { UserRepository } from '../src/features/auth/repository/user.repository';
import { UserModel } from '../src/features/auth/entity/user.model';
import { sendEmail } from '../src/common/utils/email.helper';

const mockedNodemailer = nodemailer as unknown as { createTransport: jest.Mock };
const mockedUserModel = UserModel as unknown as {
  find: jest.Mock;
  create: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findOne: jest.Mock;
};

describe('Additional passing coverage (11 tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('repo.findByEmail returns null when user absent', async () => {
    // Ensures repository propagates not-found from model.
    mockedUserModel.findOne.mockResolvedValue(null);
    const repo = new UserRepository();

    const result = await repo.findByEmail('none@example.com');

    expect(result).toBeNull();
  });

  it('repo.findByEmail returns user when found', async () => {
    // Ensures repository returns user doc when found.
    mockedUserModel.findOne.mockResolvedValue({ id: 'u1', email: 'u1@example.com' });
    const repo = new UserRepository();

    const result = await repo.findByEmail('u1@example.com');

    expect(result).toEqual({ id: 'u1', email: 'u1@example.com' });
  });

  it('repo.findById returns null when missing', async () => {
    // Ensures findById null handling.
    mockedUserModel.findById.mockResolvedValue(null);
    const repo = new UserRepository();

    const result = await repo.findById('missing');

    expect(result).toBeNull();
  });

  it('repo.findById returns user when present', async () => {
    // Ensures findById success path.
    mockedUserModel.findById.mockResolvedValue({ id: 'u2' });
    const repo = new UserRepository();

    const result = await repo.findById('u2');

    expect(result).toEqual({ id: 'u2' });
  });

  it('repo.update returns updated user', async () => {
    // Ensures update returns mutated doc.
    mockedUserModel.findByIdAndUpdate.mockResolvedValue({ id: 'u3', name: 'Updated' });
    const repo = new UserRepository();

    const result = await repo.update('u3', { name: 'Updated' } as any);

    expect(result).toEqual({ id: 'u3', name: 'Updated' });
  });

  it('repo.update returns null if user not found', async () => {
    // Ensures update null path.
    mockedUserModel.findByIdAndUpdate.mockResolvedValue(null);
    const repo = new UserRepository();

    const result = await repo.update('missing', { name: 'X' } as any);

    expect(result).toBeNull();
  });

  it('repo.findAll returns empty list when model has none', async () => {
    // Ensures sorted query can resolve empty list.
    const sort = jest.fn().mockResolvedValue([]);
    mockedUserModel.find.mockReturnValue({ sort });
    const repo = new UserRepository();

    const result = await repo.findAll();

    expect(result).toEqual([]);
  });

  it('repo.findAll returns users in sorted query result', async () => {
    // Ensures sorted query result is returned as-is.
    const sort = jest.fn().mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    mockedUserModel.find.mockReturnValue({ sort });
    const repo = new UserRepository();

    const result = await repo.findAll();

    expect(result).toHaveLength(2);
  });

  it('sendEmail forwards "from" value from SMTP_USER', async () => {
    // Ensures sender field uses SMTP_USER env.
    process.env.SMTP_USER = 'sender@example.com';
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'm1' });
    mockedNodemailer.createTransport.mockReturnValue({ sendMail });

    await sendEmail('to@example.com', 'Hi', '<p>Hello</p>');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: 'sender@example.com' }));
  });

  it('sendEmail passes recipient correctly', async () => {
    // Ensures recipient argument is preserved.
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'm2' });
    mockedNodemailer.createTransport.mockReturnValue({ sendMail });

    await sendEmail('rcpt@example.com', 'Hi', '<p>Hello</p>');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'rcpt@example.com' }));
  });

  it('sendEmail passes subject correctly', async () => {
    // Ensures subject argument is preserved.
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'm3' });
    mockedNodemailer.createTransport.mockReturnValue({ sendMail });

    await sendEmail('rcpt@example.com', 'Subject Line', '<p>Hello</p>');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Subject Line' }));
  });
});
