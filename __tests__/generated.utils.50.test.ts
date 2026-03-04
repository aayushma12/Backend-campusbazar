jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

jest.mock('../src/common/config/cloudinary.config', () => ({
  __esModule: true,
  default: {
    uploader: {
      destroy: jest.fn(),
      upload_stream: jest.fn(),
    },
  },
}));

import nodemailer from 'nodemailer';
import cloudinary from '../src/common/config/cloudinary.config';
import { sendEmail } from '../src/common/utils/email.helper';
import { extractPublicId, deleteFromCloudinary } from '../src/common/utils/cloudinary.helper';

const mockedNodemailer = nodemailer as unknown as { createTransport: jest.Mock };
const mockedCloudinary = cloudinary as unknown as {
  uploader: {
    destroy: jest.Mock;
    upload_stream: jest.Mock;
  };
};

describe('Utilities: email.helper + cloudinary.helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendEmail creates transporter and sends message', async () => {
    // Verifies transporter setup and sendMail invocation.
    const sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    mockedNodemailer.createTransport.mockReturnValue({ sendMail });

    await sendEmail('to@example.com', 'Subject', '<b>Hello</b>');

    expect(mockedNodemailer.createTransport).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@example.com', subject: 'Subject' }));
  });

  it('sendEmail uses fallback SMTP port 2525 when env port missing', async () => {
    // Verifies default port behavior.
    const oldPort = process.env.SMTP_PORT;
    delete process.env.SMTP_PORT;
    const sendMail = jest.fn().mockResolvedValue({ messageId: '2' });
    mockedNodemailer.createTransport.mockReturnValue({ sendMail });

    await sendEmail('a@a.com', 'S', '<p>x</p>');

    expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 2525 }));
    process.env.SMTP_PORT = oldPort;
  });

  it('sendEmail forwards HTML body unchanged', async () => {
    // Verifies html argument is passed as-is.
    const sendMail = jest.fn().mockResolvedValue({ messageId: '3' });
    mockedNodemailer.createTransport.mockReturnValue({ sendMail });

    await sendEmail('u@mail.com', 'Reset', '<p>Password reset link</p>');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ html: '<p>Password reset link</p>' }));
  });

  it('sendEmail forwards empty subject string', async () => {
    // Verifies empty subject is still sent.
    const sendMail = jest.fn().mockResolvedValue({ messageId: '4' });
    mockedNodemailer.createTransport.mockReturnValue({ sendMail });

    await sendEmail('u@mail.com', '', '<p>x</p>');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ subject: '' }));
  });

  it('extractPublicId parses jpg URL correctly', () => {
    // Verifies parser output for jpg URL.
    const url = 'https://res.cloudinary.com/demo/image/upload/v1730000000/campus-bazar/profiles/avatar-1.jpg';

    const publicId = extractPublicId(url);

    expect(publicId).toBe('campus-bazar/profiles/avatar-1');
  });

  it('extractPublicId parses png URL correctly', () => {
    // Verifies parser output for png URL.
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/campus-bazar/profiles/avatar-2.png';

    const publicId = extractPublicId(url);

    expect(publicId).toBe('campus-bazar/profiles/avatar-2');
  });

  it('extractPublicId handles URL with query string by preserving parser behavior', () => {
    // Verifies deterministic behavior with query params.
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/campus-bazar/profiles/avatar-3.jpg?x=1';

    const publicId = extractPublicId(url);

    expect(publicId).toBe('campus-bazar/profiles/avatar-3');
  });

  it('deleteFromCloudinary calls cloudinary destroy and returns result', async () => {
    // Verifies successful delete wrapper behavior.
    mockedCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

    const result = await deleteFromCloudinary('folder/public-id');

    expect(mockedCloudinary.uploader.destroy).toHaveBeenCalledWith('folder/public-id');
    expect(result).toEqual({ result: 'ok' });
  });

  it('deleteFromCloudinary rethrows errors from cloudinary destroy', async () => {
    // Verifies error propagation from cloudinary SDK.
    mockedCloudinary.uploader.destroy.mockRejectedValue(new Error('cloudinary failed'));

    await expect(deleteFromCloudinary('bad-id')).rejects.toThrow('cloudinary failed');
  });

  it('deleteFromCloudinary preserves returned shape for non-ok result', async () => {
    // Verifies wrapper does not mutate cloudinary response.
    mockedCloudinary.uploader.destroy.mockResolvedValue({ result: 'not found' });

    const result = await deleteFromCloudinary('missing-id');

    expect(result).toEqual({ result: 'not found' });
  });
});
