import mongoose, { Document, Schema } from 'mongoose';
import { IAccount, AccountType } from '../types';

const accountSchema = new Schema<IAccount>({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
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
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'],
    uppercase: true
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
  },
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
accountSchema.index({ userId: 1 });
accountSchema.index({ accountNumber: 1 });
accountSchema.index({ isActive: 1 });

// Check if transfer is possible - FIXED VERSION
accountSchema.methods.canTransfer = function(amount: number): boolean {
  // First reset the daily limit if needed
  const now = new Date();
  const lastReset = new Date(this.lastTransferReset);
  
  if (now.toDateString() !== lastReset.toDateString()) {
    this.usedDailyTransferAmount = 0;
    this.lastTransferReset = now;
    // Note: Caller must save the document after this
  }
  
  return this.isActive && 
         this.balance >= amount && 
         (this.usedDailyTransferAmount + amount) <= this.dailyTransferLimit;
};

// Reset daily transfer limit if it's a new day - FIXED VERSION
accountSchema.methods.resetDailyTransferLimit = function(): void {
  const now = new Date();
  const lastReset = new Date(this.lastTransferReset);
  
  if (now.toDateString() !== lastReset.toDateString()) {
    this.usedDailyTransferAmount = 0;
    this.lastTransferReset = now;
    // Note: Caller must save the document after this
  }
};

// Generate account number before saving
accountSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.version += 1;
  }
  next();
});

export default mongoose.model<IAccount>('Account', accountSchema);