import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#5865f2] to-[#4752c4] text-white hover:from-[#4752c4] hover:to-[#3c44a8] focus-visible:ring-[#5865f2] shadow-lg shadow-[#5865f2]/25 active:scale-[0.98]',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus-visible:ring-red-500 shadow-lg shadow-red-500/25',
        outline:
          'border-2 border-boxflow-primary bg-transparent hover:bg-boxflow-primary/10 text-boxflow-primary font-semibold',
        secondary: 'bg-[#404249] text-white hover:bg-[#4e5158] shadow-md',
        ghost: 'hover:bg-[#404249] text-[#b5bac1] hover:text-white',
        link: 'text-[#5865f2] underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded px-3 text-sm',
        lg: 'h-12 rounded-lg px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
