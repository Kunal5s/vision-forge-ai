
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FuturisticPanelProps extends HTMLAttributes<HTMLDivElement> {}

export function FuturisticPanel({ className, children, ...props }: FuturisticPanelProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-6 transition-shadow hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
