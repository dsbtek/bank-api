import { Request, Response } from 'express';
import { FizzBuzzService } from '../services/FizzBuzzService';
import { AppError } from '../utils/AppError';

export class FizzBuzzController {
  static getFizzBuzz(req: Request, res: Response): void {
    try {
      const result = FizzBuzzService.generateDefault();
      
      res.json({
        success: true,
        data: result,
        count: result.length
      });
    } catch (error) {
      throw new AppError('Failed to generate FizzBuzz sequence', 500);
    }
  }

  static getCustomFizzBuzz(req: Request, res: Response): void {
    try {
      const { start, end, rules } = req.query;
      
      let parsedRules: [number, string][] = [[3, 'Fizz'], [5, 'Buzz']];
      
      if (rules && typeof rules === 'string') {
        try {
          parsedRules = JSON.parse(rules);
        } catch (parseError) {
          throw new AppError('Invalid rules format. Expected JSON array of [number, string] pairs.', 400);
        }
      }

      const startNum = start ? parseInt(start as string) : 1;
      const endNum = end ? parseInt(end as string) : 100;

      if (isNaN(startNum) || isNaN(endNum)) {
        throw new AppError('Start and end must be valid numbers', 400);
      }

      if (startNum > endNum) {
        throw new AppError('Start must be less than or equal to end', 400);
      }

      const result = FizzBuzzService.generateCustom(startNum, endNum, parsedRules);
      
      res.json({
        success: true,
        data: result,
        count: result.length,
        config: {
          start: startNum,
          end: endNum,
          rules: parsedRules
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate custom FizzBuzz sequence', 500);
    }
  }
}