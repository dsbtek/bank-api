import { FizzBuzzConfig } from '../types';

export class FizzBuzzService {
  static generate(config: FizzBuzzConfig): (string | number)[] {
    const [start, end] = config.range;
    const result: (string | number)[] = [];
    
    for (let i = start; i <= end; i++) {
      let output = '';
      
      // Apply rules in order (allows for extensibility)
      for (const [divisor, word] of config.rules) {
        if (i % divisor === 0) output += word;
      }
      
      result.push(output || i);
    }
    
    return result;
  }

  static generateDefault(): (string | number)[] {
    const config: FizzBuzzConfig = {
      range: [1, 100],
      rules: new Map([
        [3, 'Fizz'],
        [5, 'Buzz']
      ])
    };
    
    return this.generate(config);
  }

  static generateCustom(
    start: number = 1, 
    end: number = 100, 
    rules: [number, string][] = [[3, 'Fizz'], [5, 'Buzz']]
  ): (string | number)[] {
    const config: FizzBuzzConfig = {
      range: [start, end],
      rules: new Map(rules)
    };
    
    return this.generate(config);
  }
}