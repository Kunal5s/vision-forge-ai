
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FuturisticPanelProps extends HTMLAttributes<HTMLDivElement> {}

export function FuturisticPanel({ className, children, ...props }: FuturisticPanelProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:shadow-primary/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
