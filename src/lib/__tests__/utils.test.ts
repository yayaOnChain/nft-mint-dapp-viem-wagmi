import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility function', () => {
  it('should merge classes correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should handle false conditionals', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should handle object syntax', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-500': false,
    });
    expect(result).toBe('text-red-500');
  });

  it('should handle array syntax', () => {
    const result = cn(['text-red-500', 'bg-blue-500']);
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle nested arrays', () => {
    const result = cn(['text-red-500', ['bg-blue-500', 'p-4']]);
    expect(result).toBe('text-red-500 bg-blue-500 p-4');
  });

  it('should merge tailwind classes with twMerge', () => {
    // twMerge should handle conflicting classes
    const result = cn('p-4 p-8');
    expect(result).toBe('p-8');
  });

  it('should handle empty strings and null', () => {
    const result = cn('text-red-500', null, '', undefined, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle complex combinations', () => {
    const isActive = true;
    const variant = 'primary';

    const result = cn(
      'base-class',
      {
        'active-class': isActive,
        'inactive-class': !isActive,
      },
      [
        'array-class',
        variant === 'primary' && 'primary-variant',
      ],
    );

    expect(result).toBe(
      'base-class active-class array-class primary-variant',
    );
  });

  it('should handle undefined input', () => {
    const result = cn(undefined);
    expect(result).toBe('');
  });

  it('should handle number 0', () => {
    const result = cn(0, 'text-red-500');
    expect(result).toBe('text-red-500');
  });
});
