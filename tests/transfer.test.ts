import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import Account from '../src/models/Account';
import { AuthService } from '../src/services/AuthService';

describe('Transfer API', () => {
  let authToken: string;
  let userId: string;
  let account1: any;
  let account2: any;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bank-api-test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Account.deleteMany({});

    // Create test user
    const user = await User.create({
      email: 'transfer@test.com',
      password: 'password123',
      firstName: 'Transfer',
      lastName: 'User',
      phone: '+1234567890'
    });

    userId = user._id.toString();

    // Create accounts
    account1 = await Account.create({
      userId: user._id,
      balance: 1000,
      currency: 'USD'
    });

    account2 = await Account.create({
      userId: new mongoose.Types.ObjectId(), // Different user
      balance: 500,
      currency: 'USD'
    });

    // Generate auth token
    const tokens = await AuthService.generateTokens(user);
    authToken = tokens.accessToken;
  });

  describe('POST /api/v1/transfers', () => {
    it('should transfer funds between accounts', async () => {
      const transferData = {
        fromAccountId: account1._id.toString(),
        toAccountNumber: account2.accountNumber,
        amount: 100,
        reference: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.amount).toBe(100);

      // Verify balances updated
      const updatedAccount1 = await Account.findById(account1._id);
      const updatedAccount2 = await Account.findById(account2._id);

      expect(updatedAccount1.balance).toBe(900);
      expect(updatedAccount2.balance).toBe(600);
    });

    it('should not transfer with insufficient funds', async () => {
      const transferData = {
        fromAccountId: account1._id.toString(),
        toAccountNumber: account2.accountNumber,
        amount: 2000,
        reference: 'Large transfer'
      };

      const response = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});