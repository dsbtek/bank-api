import { FizzBuzzService } from '../src/services/FizzBuzzService';

describe('FizzBuzzService', () => {
  describe('generate', () => {
    it('should generate default FizzBuzz sequence', () => {
      const result = FizzBuzzService.generateDefault();
      
      expect(result).toHaveLength(100);
      expect(result[0]).toBe(1);
      expect(result[2]).toBe('Fizz');
      expect(result[4]).toBe('Buzz');
      expect(result[14]).toBe('FizzBuzz');
      expect(result[99]).toBe('Buzz');
    });

    it('should generate custom sequence with different rules', () => {
      const result = FizzBuzzService.generateCustom(1, 15, [[2, 'Even'], [3, 'Three']]);
      
      expect(result).toEqual([
        1, 'Even', 'Three', 'Even', 5, 'EvenThree', 7, 'Even', 'Three', 'Even',
        11, 'EvenThree', 13, 'Even', 'Three'
      ]);
    });

    it('should handle empty rules', () => {
      const result = FizzBuzzService.generateCustom(1, 5, []);
      
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle single rule', () => {
      const result = FizzBuzzService.generateCustom(1, 5, [[2, 'Two']]);
      
      expect(result).toEqual([1, 'Two', 3, 'Two', 5]);
    });
  });
});