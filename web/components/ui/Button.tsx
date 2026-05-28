import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-cream hover:bg-forest-deep active:bg-forest-deep',
  secondary:
    'bg-paper text-ink border border-hairline hover:bg-cream-soft active:bg-cream-soft',
  ghost: 'bg-transparent text-ink hover:bg-cream-soft',
  danger: 'bg-red-700 text-white hover:bg-red-800',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', className, ...rest }, ref) => (
    <button
      ref={ref}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
          variants[variant],
          sizes[size],
          className,
        ),
      )}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
