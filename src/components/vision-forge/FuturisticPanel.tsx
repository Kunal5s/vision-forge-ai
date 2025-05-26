import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FuturisticPanelProps extends HTMLAttributes<HTMLDivElement> {}

export function FuturisticPanel({ className, children, ...props }: FuturisticPanelProps) {
  return (
    <div
      className={cn(
        'glassmorphism-panel p-6 rounded-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
