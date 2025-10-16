import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/default';
import redisClient from '../utils/redis';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { LoginRequest, IUser, SignupRequest, UserRole } from '../types';
import ms from 'ms';

export class AuthService {
  static async signup(userData: SignupRequest): Promise<{ user: IUser; tokens: any }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Create user
    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
      role: userData.role || UserRole.CUSTOMER
    });

    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  static async login(loginData: LoginRequest): Promise<{ user: IUser; tokens: any }> {
    const { email, password } = loginData;

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new AppError('Account is temporarily locked. Try again later.', 423);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      throw new AppError('Invalid email or password', 401);
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { loginAttempts: 0 },
          $unset: { lockUntil: 1 }
        }
      );
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  static async generateTokens(user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionId = crypto.randomBytes(16).toString('hex');

    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      },
      config.jwt.secret as string,
      { expiresIn: config.jwt.accessExpiry as ms.StringValue } // 👈 cast it here
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Store refresh token in Redis
    await redisClient.set(
      `refresh_token:${refreshToken}`,
      JSON.stringify({
        userId: user._id.toString(),
        sessionId,
        createdAt: new Date().toISOString()
      }),
      'EX', 7 * 24 * 60 * 60 // 7 days
    );

    return { accessToken, refreshToken };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token exists in Redis
    const tokenData = await redisClient.get(`refresh_token:${refreshToken}`);
    if (!tokenData) {
      throw new AppError('Invalid refresh token', 401);
    }

    const { userId, sessionId } = JSON.parse(tokenData);

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Delete old refresh token
    await redisClient.del(`refresh_token:${refreshToken}`);

    // Generate new tokens
    return this.generateTokens(user);
  }

  static async logout(refreshToken: string): Promise<void> {
    await redisClient.del(`refresh_token:${refreshToken}`);
  }

  static async logoutAllSessions(userId: string): Promise<void> {
    // This would require a more sophisticated implementation
    // to track all sessions for a user. For simplicity, we'll
    // just note that this would delete all refresh tokens for the user.
    const pattern = `refresh_token:*`;
    // Note: In production, use SCAN for large datasets
  }
}