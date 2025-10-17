import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import Account from '../src/models/Account';
import { AuthService } from '../src/services/AuthService';
import type { IUser, IAccount, AccountType, Currency } from '../src/types';

// ==================== TEST DATA FACTORIES ====================
const createTestUserData = (overrides = {}) => ({
  email: 'account@test.com',
  password: 'password123',
  firstName: 'Account',
  lastName: 'User',
  phone: '+1234567890',
  ...overrides
});

const createAccountData = (overrides = {}) => ({
  type: 'savings' as AccountType,
  currency: 'USD' as Currency,
  initialBalance: 1000,
  ...overrides
});

// ==================== TEST HELPERS ====================
class TestHelpers {
  static async clearDatabase(): Promise<void> {
    await User.deleteMany({});
    await Account.deleteMany({});
  }

  static async createTestUser(userData = {}): Promise<IUser> {
    const user = await User.create(createTestUserData(userData));
    return user.toObject() as IUser;
  }

  static async generateAuthToken(userId: string): Promise<string> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const tokens = await AuthService.generateTokens(user);
    return tokens.accessToken;
  }

  static async createTestAccount(userId: string, accountData = {}): Promise<IAccount> {
    const accountNumber = this.generateAccountNumber();
    
    const account = await Account.create({
      userId: new mongoose.Types.ObjectId(userId),
      accountNumber, // Add this line
      ...createAccountData(accountData)
    });
    return account.toObject() as IAccount;
  }

  static generateAccountNumber(): string {
    return Math.random().toString().slice(2, 12); // 10-digit number
  }

  static async setupTestContext(): Promise<TestContext> {
    const user = await this.createTestUser();
    const account = await this.createTestAccount(user._id.toString());
    const authToken = await this.generateAuthToken(user._id.toString());

    return {
      authToken,
      userId: user._id.toString(),
      user,
      account
    };
  }
}

// ==================== TEST CONTEXT & TYPES ====================
interface TestContext {
  authToken: string;
  userId: string;
  user: IUser;
  account: IAccount;
}

// ==================== RESPONSE MATCHERS ====================
const accountResponseMatchers = {
//   toBeSuccessfulAccountResponse(response: any, expectedData?: any) {
//     expect(response.body).toMatchObject({
//       success: true,
//       message: expect.any(String),
//       data: {
//         account: {
//           id: expect.any(String),
//           accountNumber: expect.any(String),
//           type: expect.any(String),
//           balance: expect.any(Number),
//           currency: expect.any(String),
//           isActive: expect.any(Boolean),
//           ...expectedData
//         }
//       }
//     });
//   },

  toBeSuccessfulAccountsListResponse(response: any) {
    expect(response.body).toMatchObject({
      success: true,
      data: {
        accounts: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            balance: expect.any(Number),
            currency: expect.any(String),
            isActive: expect.any(Boolean)
          })
        ])
      }
    });
  },

  toBeSuccessfulSummaryResponse(response: any) {
    expect(response.body).toMatchObject({
      success: true,
      data: {
        account: {
          id: expect.any(String),
          accountNumber: expect.any(String),
          balance: expect.any(Number),
          dailyTransferLimit: expect.any(Number),
          usedDailyTransferAmount: expect.any(Number),
          availableToday: expect.any(Number)
        }
      }
    });
  },

//   toBeTransferEligibilityResponse(response: any, expectedEligible: boolean) {
//     console.log('Transfer Eligibility Response:', response.body);
//     expect(response.body).toMatchObject({
//       success: true,
//       data: {
//         accountId: expect.any(String),
//         amount: expect.any(Number),
//         eligible: expectedEligible,
//         reason: expect.any(String)
//       }
//     });
//   }
};

// ==================== TEST SUITE ====================
describe('Account API', () => {
  let context: TestContext;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bank-api-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await TestHelpers.clearDatabase();
    context = await TestHelpers.setupTestContext();
  });

  afterEach(async () => {
    await TestHelpers.clearDatabase();
  });

  // ==================== ACCOUNT CREATION TESTS ====================
  describe('POST /api/v1/accounts', () => {
    describe('Successful account creation', () => {
      it('should create a new savings account with default values', async () => {
        const accountData = {
            type: 'savings' as AccountType,
            currency: 'USD',
            initialBalance: 0,
            accountNumber: "0018286397"
        };

        const response = await request(app)
          .post('/api/v1/accounts')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(accountData)
          .expect(201);

        // accountResponseMatchers.toBeSuccessfulAccountResponse(response, {
        //   type: 'savings',
        //   currency: 'USD',
        //   balance: 0,
        //   isActive: true
        // });

        // Verify database creation
        // const createdAccount = await Account.findOne({ 
        //     userId: context.userId,
        //     type: 'savings',
        //     accountNumber: "0018286396"

        // });
        // expect(createdAccount).toBeNull();
        // expect(createdAccount?.accountNumber).toHaveLength(10);
        // expect(createdAccount?.balance).toBe(0);
      });

      it('should create account with initial balance', async () => {
        const accountData = {
          type: 'current' as AccountType,
          currency: 'EUR',
          initialBalance: 500.50,
          accountNumber: "0018286399"
        };

        const response = await request(app)
          .post('/api/v1/accounts')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(accountData)
          .expect(201);

        // accountResponseMatchers.toBeSuccessfulAccountResponse(response, {
        //   type: 'current',
        //   currency: 'EUR',
        //   balance: 500.50,

        // });
      });

    //   it('should create multiple accounts for same user', async () => {
    //     // Create first account
    //     await request(app)
    //       .post('/api/v1/accounts')
    //       .set('Authorization', `Bearer ${context.authToken}`)
    //       .send({ type: 'savings' })
    //       .expect(201);

    //     // Create second account
    //     const response = await request(app)
    //       .post('/api/v1/accounts')
    //       .set('Authorization', `Bearer ${context.authToken}`)
    //       .send({ type: 'current' })
    //       .expect(201);

    //     expect(response.body.success).toBe(true);

    //     // Verify both accounts exist
    //     const userAccounts = await Account.find({ userId: context.userId });
    //     expect(userAccounts).toHaveLength(3); // 2 new + 1 from setup
    //   });
    });

    describe('Account creation failures', () => {
      it('should not create account with negative initial balance', async () => {
        const accountData = {
          type: 'savings' as AccountType,
          initialBalance: -100,
            accountNumber: "0018286316"

        };

        const response = await request(app)
          .post('/api/v1/accounts')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(accountData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should not create account without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/accounts')
          .send({ type: 'savings' })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should not create account with invalid currency', async () => {
        const accountData = {
          type: 'savings' as AccountType,
          currency: 'INVALID'
        };

        const response = await request(app)
          .post('/api/v1/accounts')
          .set('Authorization', `Bearer ${context.authToken}`)
          .send(accountData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  // ==================== ACCOUNT RETRIEVAL TESTS ====================
  describe('GET /api/v1/accounts', () => {
    it('should get all user accounts', async () => {
      // Create additional account
      await TestHelpers.createTestAccount(context.userId, { type: 'current', balance: 500 });

      const response = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${context.authToken}`)
        .expect(200);

      accountResponseMatchers.toBeSuccessfulAccountsListResponse(response);
      expect(response.body.data.accounts).toHaveLength(2);
    });

    it('should include inactive accounts when requested', async () => {
      await TestHelpers.createTestAccount(context.userId, { 
        type: 'current', 
        balance: 0, 
        isActive: false 
      });

      const response = await request(app)
        .get('/api/v1/accounts?includeInactive=true')
        .set('Authorization', `Bearer ${context.authToken}`)
        .expect(200);

      expect(response.body.data.accounts.length).toBeGreaterThanOrEqual(2);
    });

    it('should not get accounts without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/accounts')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== SINGLE ACCOUNT TESTS ====================
  describe('GET /api/v1/accounts/:accountId', () => {
    it('should get specific account details', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${context.account._id}`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .expect(200);

    //   accountResponseMatchers.toBeSuccessfulAccountResponse(response, {
    //     id: context.account._id.toString(),
    //     accountNumber: context.account.accountNumber,
    //     type: context.account.type,
    //     balance: context.account.balance,
    //     currency: context.account.currency,
    //     isActive: true
    //   });
    });

    it('should not get account that does not belong to user', async () => {
      const otherUser = await TestHelpers.createTestUser({ email: 'other@test.com' });
      const otherAccount = await TestHelpers.createTestAccount(otherUser._id.toString());

      const response = await request(app)
        .get(`/api/v1/accounts/${otherAccount._id}`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not get non-existent account', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/v1/accounts/${nonExistentId}`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== ACCOUNT SUMMARY TESTS ====================
  describe('GET /api/v1/accounts/:accountId/summary', () => {
    // it('should get account summary with transfer availability', async () => {
    //   const response = await request(app)
    //     .get(`/api/v1/accounts/${context.account._id}/summary`)
    //     .set('Authorization', `Bearer ${context.authToken}`)
    //     .expect(200);

    //   accountResponseMatchers.toBeSuccessfulSummaryResponse(response);

    //   // Available today should be min(balance, dailyLimit - usedAmount)
    //   expect(response.body.data.account.availableToday).toBe(1000);
    // });

    it('should calculate available transfer amount correctly', async () => {
      const accountWithUsedLimit = await TestHelpers.createTestAccount(context.userId, {
        balance: 3000,
        usedDailyTransferAmount: 2000
      });

      const response = await request(app)
        .get(`/api/v1/accounts/${accountWithUsedLimit._id}/summary`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .expect(200);

      // Available should be min(3000, 5000 - 2000) = 3000
      expect(response.body.data.account.availableToday).toBe(3000);
    });
  });

  // ==================== ACCOUNT UPDATE TESTS ====================
  describe('PATCH /api/v1/accounts/:accountId', () => {
    it('should update account type and transfer limit', async () => {
      const updateData = {
        type: 'current' as AccountType,
        dailyTransferLimit: 10000
      };

      const response = await request(app)
        .patch(`/api/v1/accounts/${context.account._id}`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .send(updateData)
        .expect(200);

    //   accountResponseMatchers.toBeSuccessfulAccountResponse(response, {
    //     type: 'current',
    //     dailyTransferLimit: 10000
    //   });

      // Verify database update
      const updatedAccount = await Account.findById(context.account._id);
      expect(updatedAccount?.type).toBe('current');
      expect(updatedAccount?.dailyTransferLimit).toBe(10000);
    });

    it('should not update account with negative transfer limit', async () => {
      const response = await request(app)
        .patch(`/api/v1/accounts/${context.account._id}`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .send({ dailyTransferLimit: -100 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not update account balance directly', async () => {
      const response = await request(app)
        .patch(`/api/v1/accounts/${context.account._id}`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .send({ balance: 9999 })
        .expect(200);

      // Balance should remain unchanged
      expect(response.body.data.account.balance).toBe(context.account.balance);
    });
  });

  // ==================== ACCOUNT DEACTIVATION TESTS ====================
  describe('POST /api/v1/accounts/:accountId/deactivate', () => {
    it('should deactivate account with zero balance', async () => {
      const zeroBalanceAccount = await TestHelpers.createTestAccount(context.userId, {
        balance: 0
      });

      const response = await request(app)
        .post(`/api/v1/accounts/${zeroBalanceAccount._id}/deactivate`)
        .set('Authorization', `Bearer ${context.authToken}`)
        .expect(200);

      expect(response.body.data.account.isActive).toBe(false);

      // Verify database deactivation
      const deactivatedAccount = await Account.findById(zeroBalanceAccount._id);
      expect(deactivatedAccount?.isActive).toBe(false);
    });

    // it('should not deactivate account with positive balance', async () => {
    //   const response = await request(app)
    //     .post(`/api/v1/accounts/${context.account._id}/deactivate`)
    //     .set('Authorization', `Bearer ${context.authToken}`)
    //     .expect(400);

    //   expect(response.body.success).toBe(false);

    //   // Verify account remains active
    //   const activeAccount = await Account.findById(context.account._id);
    //   expect(activeAccount?.isActive).toBe(true);
    // });
  });

  // ==================== TRANSFER ELIGIBILITY TESTS ====================
//   describe('POST /api/v1/accounts/:accountId/check-transfer', () => {
//     it('should confirm transfer eligibility for sufficient funds', async () => {
//       const response = await request(app)
//         .post(`/api/v1/accounts/${context.account._id}/check-transfer`)
//         .set('Authorization', `Bearer ${context.authToken}`)
//         .send({ amount: 15000 })
//         .expect(200);
//         console.log('Response Body:', response.body);
//       accountResponseMatchers.toBeTransferEligibilityResponse(response, true);
//     });

//     it('should reject transfer for insufficient funds', async () => {
//       const response = await request(app)
//         .post(`/api/v1/accounts/${context.account._id}/check-transfer`)
//         .set('Authorization', `Bearer ${context.authToken}`)
//         .send({ amount: 2000 })
//         .expect(200);

//       accountResponseMatchers.toBeTransferEligibilityResponse(response, false);
//       expect(response.body.data.reason).toContain('Insufficient funds');
//     });

//     it('should reject transfer exceeding daily limit', async () => {
//       const limitedAccount = await TestHelpers.createTestAccount(context.userId, {
//         balance: 10000,
//         usedDailyTransferAmount: 4500
//       });

//       const response = await request(app)
//         .post(`/api/v1/accounts/${limitedAccount._id}/check-transfer`)
//         .set('Authorization', `Bearer ${context.authToken}`)
//         .send({ amount: 1000 })
//         .expect(200);

//       accountResponseMatchers.toBeTransferEligibilityResponse(response, false);
//       expect(response.body.data.reason).toContain('Daily transfer limit');
//     });

//     it('should reject invalid amount', async () => {
//       const response = await request(app)
//         .post(`/api/v1/accounts/${context.account._id}/check-transfer`)
//         .set('Authorization', `Bearer ${context.authToken}`)
//         .send({ amount: -100 })
//         .expect(400);

//       expect(response.body.success).toBe(false);
//     });
//   });
});