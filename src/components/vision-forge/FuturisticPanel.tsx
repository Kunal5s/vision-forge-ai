
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FuturisticPanelProps extends HTMLAttributes<HTMLDivElement> {}

export function FuturisticPanel({ className, children, ...props }: FuturisticPanelProps) {
  return (
    <div
      className={cn(
        'bg-card border-foreground/80 border rounded-xl p-6 shadow-sm relative overflow-hidden animate-breathing-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
