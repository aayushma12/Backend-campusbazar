import { BookingService } from '../service/booking.service';

jest.mock('../entity/booking.model', () => ({
  BookingModel: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../entity/wallet.model', () => ({
  WalletModel: {
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../payment/entity/transaction.model', () => ({
  TransactionModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../chat/entity/conversation.model', () => ({
  ConversationModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../auth/entity/user.model', () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));

import { BookingModel } from '../entity/booking.model';
import { WalletModel } from '../entity/wallet.model';
import { TransactionModel } from '../../payment/entity/transaction.model';
import { ConversationModel } from '../../chat/entity/conversation.model';

const asMock = <T>(fn: T) => fn as unknown as jest.Mock;

const queryResult = <T>(value: T) => {
  const chain: any = {
    populate: jest.fn().mockReturnThis(),
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(value).catch(reject),
  };
  return chain;
};

describe('BookingService.confirmPayment', () => {
  const service = new BookingService();
  const studentId = 'student-1';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns alreadyPaid and does not credit wallet when transaction is already done (idempotent replay)', async () => {
    const booking = {
      _id: 'booking-1',
      studentId: { toString: () => studentId },
      tutorId: 'tutor-1',
      totalAmount: 1000,
      netToTutor: 900,
      status: 'paid',
      save: jest.fn(),
    } as any;

    asMock(TransactionModel.findOne).mockResolvedValue({
      _id: 'txn-1',
      status: 'done',
      transactionUUID: 'uuid-1',
    });

    asMock(BookingModel.findOne).mockReturnValue(queryResult(booking));

    const result = await service.confirmPayment(studentId, {
      transactionCode: 'TXN-CODE',
      transactionUUID: 'uuid-1',
      amount: '1000',
    });

    expect(result).toEqual({ alreadyPaid: true, booking });
    expect(WalletModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(TransactionModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('processes pending transaction once and marks booking paid', async () => {
    const booking = {
      _id: 'booking-2',
      studentId: { toString: () => studentId },
      tutorId: { toString: () => 'tutor-2' },
      totalAmount: 1500,
      netToTutor: 1350,
      status: 'awaiting_payment',
      conversationId: undefined,
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    const conversation = { _id: 'conv-1' } as any;

    asMock(BookingModel.findById).mockReturnValue(queryResult(booking));

    asMock(TransactionModel.findOne).mockResolvedValue({
      _id: 'txn-2',
      status: 'pending',
      transactionUUID: 'uuid-2',
    });

    asMock(TransactionModel.findOneAndUpdate).mockResolvedValue({
      _id: 'txn-2',
      status: 'done',
      transactionUUID: 'uuid-2',
      transactionCode: 'TXN-CODE-2',
    });

    asMock(WalletModel.findOneAndUpdate).mockResolvedValue({
      userId: 'tutor-2',
      balance: 1350,
    });

    asMock(ConversationModel.findOne).mockResolvedValue(null);
    asMock(ConversationModel.create).mockResolvedValue(conversation);

    const result = await service.confirmPayment(studentId, {
      bookingId: 'booking-2',
      transactionCode: 'TXN-CODE-2',
      transactionUUID: 'uuid-2',
      amount: '1500',
    });

    expect(TransactionModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(WalletModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(booking.status).toBe('paid');
    expect(booking.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ booking, conversation });
  });
});
