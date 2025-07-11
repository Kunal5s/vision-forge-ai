
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FuturisticPanelProps extends HTMLAttributes<HTMLDivElement> {}

export function FuturisticPanel({ className, children, ...props }: FuturisticPanelProps) {
  return (
    <div
      className={cn(
        'bg-card border-2 border-foreground rounded-xl p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
