import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import Account from '../src/models/Account';
import { AuthService } from '../src/services/AuthService';
import type { IUser, IAccount } from '../src/types';

// Test constants
const TEST_USER = {
  email: 'transfer@test.com',
  password: 'password123',
  firstName: 'Transfer',
  lastName: 'User',
  phone: '+1234567890'
};

const ACCOUNT_DATA = {
  balance: 1000,
  currency: 'USD' as const
};

// Test helper interfaces
interface TestContext {
  authToken: string;
  userId: string;
  sourceAccount: IAccount;
  targetAccount: IAccount;
}

describe('Transfer API', () => {
  let context: TestContext;

  beforeAll(async () => {
    // Connection is handled in global setup, so we can remove this
    // or keep it as a safety check
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bank-api-test');
    }
  });

  afterAll(async () => {
    // Database cleanup is handled in global setup
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear relevant collections
    await User.deleteMany({});
    await Account.deleteMany({});

    // Create test user and accounts
    const { authToken, userId, sourceAccount, targetAccount } = await setupTestData();
    
    context = {
      authToken,
      userId,
      sourceAccount,
      targetAccount
    };
  });

  afterEach(async () => {
    // Additional cleanup if needed
    await User.deleteMany({});
    await Account.deleteMany({});
  });

  describe('POST /api/v1/transfers', () => {
    describe('Successful transfers', () => {
      it('should transfer funds between accounts', async () => {
        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(),
          toAccountNumber: context.targetAccount.accountNumber,
          amount: 100,
          reference: 'Test transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(transferData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            transaction: {
              amount: 100
            }
          }
        });

        // Verify balances were updated correctly
        const [updatedSource, updatedTarget] = await Promise.all([
          Account.findById(context.sourceAccount._id),
          Account.findById(context.targetAccount._id)
        ]);

        expect(updatedSource?.balance).toBe(900); // 1000 - 100
        expect(updatedTarget?.balance).toBe(600); // 500 + 100
      });

      it('should handle minimum transfer amount', async () => {
        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(),
          toAccountNumber: context.targetAccount.accountNumber,
          amount: 1, // Minimum amount
          reference: 'Minimum transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(transferData)
          .expect(201);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Failed transfers', () => {
      it('should not transfer with insufficient funds', async () => {
        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(),
          toAccountNumber: context.targetAccount.accountNumber,
          amount: 2000, // More than balance
          reference: 'Large transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(transferData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false
        });

        // Verify balances remain unchanged
        const [unchangedSource, unchangedTarget] = await Promise.all([
          Account.findById(context.sourceAccount._id),
          Account.findById(context.targetAccount._id)
        ]);

        expect(unchangedSource?.balance).toBe(ACCOUNT_DATA.balance);
        expect(unchangedTarget?.balance).toBe(500);
      });

      it('should not transfer to non-existent account', async () => {
        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(),
          toAccountNumber: 'NONEXISTENT123',
          amount: 100,
          reference: 'Invalid account transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(transferData)
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      it('should not transfer without authentication', async () => {
        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(),
          toAccountNumber: context.targetAccount.accountNumber,
          amount: 100,
          reference: 'Unauthorized transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .send(transferData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should not transfer with invalid account ownership', async () => {
        // Create another user and try to transfer from their account
        const otherUser = await User.create({
          email: 'other@test.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'User',
          phone: '+1987654321'
        });

        const otherUserToken = (await AuthService.generateTokens(otherUser)).accessToken;

        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(), // Not owned by otherUser
          toAccountNumber: context.targetAccount.accountNumber,
          amount: 100,
          reference: 'Invalid ownership transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send(transferData)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Validation tests', () => {
      it('should reject negative amount', async () => {
        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(),
          toAccountNumber: context.targetAccount.accountNumber,
          amount: -100,
          reference: 'Negative transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(transferData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject zero amount', async () => {
        const transferData = {
          fromAccountId: context.sourceAccount._id.toString(),
          toAccountNumber: context.targetAccount.accountNumber,
          amount: 0,
          reference: 'Zero transfer'
        };

        const response = await request(app)
          .post('/api/v1/transfers')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(transferData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  // Helper function to set up test data
  async function setupTestData(): Promise<TestContext> {
    // Create test user
    const user = await User.create(TEST_USER);
    const userId = user._id.toString();

    // Helper function to generate random account number
    const generateAccountNumber = () => {
      return '0018286396';
    };

    // Create source account (owned by test user)
    const sourceAccount = await Account.create({
      userId: user._id,
      accountNumber: "0018286397", // Add accountNumber
      ...ACCOUNT_DATA
    });

    // Create target account (owned by different user)
    const targetAccount = await Account.create({
      userId: new mongoose.Types.ObjectId(),
      accountNumber: "0018286398", // Add accountNumber
      balance: 500,
      currency: 'USD' as const
    });

    // Generate authentication token
    const tokens = await AuthService.generateTokens(user);
    const authToken = tokens.accessToken;

    return {
      authToken,
      userId,
      sourceAccount: sourceAccount.toObject() as IAccount,
      targetAccount: targetAccount.toObject() as IAccount
    };
  }
});