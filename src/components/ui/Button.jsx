import React from 'react';
import { cn } from '@/lib/utils';

export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', icon, children, ...props }, ref) => {
    // 48x48px min mobile touch target, rounded-full pill design, 3D tactile press feel
    const base =
      'inline-flex items-center justify-center font-bold rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] select-none min-h-[48px]';

    const sizes = {
      sm: 'px-4 py-2 text-xs gap-1.5 min-w-[48px]',
      md: 'px-5 py-2.5 text-sm gap-2 min-w-[48px]',
      lg: 'px-6 py-3 text-base gap-2.5 font-bold min-w-[48px]',
      icon: 'w-12 h-12 p-0 flex items-center justify-center',
    };

    const variants = {
      // Primary tactile play button: #c0c1ff text on-primary, shadow
      primary:
        'bg-primary text-on-primary hover:bg-primary-fixed shadow-md shadow-primary/20 active:translate-y-0.5',
      // Secondary action button: cyber cyan accent
      secondary:
        'bg-secondary text-on-secondary hover:bg-secondary-fixed shadow-md shadow-secondary/20 active:translate-y-0.5',
      // Surface container interactive: elevated slate
      surface:
        'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 active:translate-y-0.5',
      // Ghost: transparent with hover glow
      ghost:
        'bg-transparent hover:bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface',
      // Outline: subtle border
      outline:
        'bg-transparent border border-outline-variant hover:border-secondary text-on-surface hover:bg-surface-container/50',
      // Danger / Alert
      danger:
        'bg-error text-on-error hover:bg-error-container hover:text-on-error-container shadow-md',
    };

    return (
      <button ref={ref} className={cn(base, sizes[size], variants[variant], className)} {...props}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
