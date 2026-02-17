// Layout utility components for positioning and flow
export { default as Card } from '../ui/Card';
export { default as Badge } from '../ui/Badge';

interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  wrap?: boolean;
  className?: string;
}

/**
 * Flexible box layout component
 */
export function Flex({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  gap = 'none',
  wrap = false,
  className = ''
}: FlexProps) {
  const directionClass = direction === 'column' ? 'flex-col' : 'flex-row';
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }[align];
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }[justify];
  const gapClass = {
    none: '',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }[gap];
  const wrapClass = wrap ? 'flex-wrap' : '';

  return (
    <div
      className={`flex ${directionClass} ${alignClass} ${justifyClass} ${gapClass} ${wrapClass} ${className}`}
    >
      {children}
    </div>
  );
}

interface StackProps {
  children: React.ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Vertical stack layout component
 */
export function Stack({
  children,
  spacing = 'md',
  className = ''
}: StackProps) {
  const spacingClass = {
    none: '',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  }[spacing];

  return <div className={`${spacingClass} ${className}`}>{children}</div>;
}

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * CSS Grid layout component
 */
export function Grid({
  children,
  cols = 1,
  gap = 'md',
  className = ''
}: GridProps) {
  const colsClass = `grid-cols-${cols}`;
  const gapClass = {
    none: '',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }[gap];

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

interface CenterProps {
  children: React.ReactNode;
  axis?: 'both' | 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Center content along one or both axes
 */
export function Center({
  children,
  axis = 'both',
  className = ''
}: CenterProps) {
  const flexClass = {
    both: 'flex items-center justify-center',
    horizontal: 'flex justify-center',
    vertical: 'flex items-center'
  }[axis];

  return <div className={`${flexClass} ${className}`}>{children}</div>;
}

interface SpacerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  axis?: 'horizontal' | 'vertical';
}

/**
 * Add spacing between elements
 */
export function Spacer({ size = 'md', axis = 'vertical' }: SpacerProps) {
  const sizeMap = {
    sm: axis === 'vertical' ? 'h-2' : 'w-2',
    md: axis === 'vertical' ? 'h-4' : 'w-4',
    lg: axis === 'vertical' ? 'h-6' : 'w-6',
    xl: axis === 'vertical' ? 'h-8' : 'w-8'
  };

  return <div className={sizeMap[size]} />;
}
