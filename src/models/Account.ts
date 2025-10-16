import mongoose, { Document, Schema } from 'mongoose';
import { IAccount, AccountType } from '../types';

const accountSchema = new Schema<IAccount>({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    length: 10,
    match: [/^\d{10}$/, 'Account number must be 10 digits']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(AccountType),
    default: AccountType.SAVINGS
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    length: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dailyTransferLimit: {
    type: Number,
    default: 5000 // $5000 daily limit
  },
  usedDailyTransferAmount: {
    type: Number,
    default: 0
  },
  lastTransferReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
accountSchema.index({ userId: 1 });
accountSchema.index({ accountNumber: 1 });
accountSchema.index({ isActive: 1 });

// Check if transfer is possible
accountSchema.methods.canTransfer = function(amount: number): boolean {
  this.resetDailyTransferLimit();
  
  return this.isActive && 
         this.balance >= amount && 
         (this.usedDailyTransferAmount + amount) <= this.dailyTransferLimit;
};

// Reset daily transfer limit if it's a new day
accountSchema.methods.resetDailyTransferLimit = function(): void {
  const now = new Date();
  const lastReset = new Date(this.lastTransferReset);
  
  if (now.toDateString() !== lastReset.toDateString()) {
    this.usedDailyTransferAmount = 0;
    this.lastTransferReset = now;
  }
};

// Generate account number before saving
accountSchema.pre('save', async function(next) {
  if (this.isNew && !this.accountNumber) {
    let accountNumber: string;
    let exists: boolean;
    
    do {
      accountNumber = Math.random().toString().slice(2, 12); // 10-digit number
      exists = await mongoose.model('Account').exists({ accountNumber }) !== null;
    } while (exists);
    
    this.accountNumber = accountNumber;
  }
  next();
});

export default mongoose.model<IAccount>('Account', accountSchema);