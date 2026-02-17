// Utility functions for composing className strings

/**
 * Joins class names, filtering out falsy values
 * Usage: cn('base', condition && 'conditional', 'always')
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates conditional class names based on a boolean
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string {
  return condition ? trueClass : falseClass;
}

/**
 * Common spacing variants
 */
export const spacing = {
  none: '',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6'
} as const;

/**
 * Common padding variants
 */
export const padding = {
  none: '',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6'
} as const;

/**
 * Common text size variants
 */
export const textSize = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl'
} as const;

/**
 * Common rounded variants
 */
export const rounded = {
  none: '',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
} as const;
