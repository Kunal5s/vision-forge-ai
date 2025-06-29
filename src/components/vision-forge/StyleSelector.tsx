
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import type { StyleOption } from '@/lib/constants';
import { ScrollArea } from '../ui/scroll-area';

interface StyleSelectorProps {
  title: string;
  options: StyleOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export function StyleSelector({ title, options, selectedValue, onSelect }: StyleSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 block text-foreground/90">{title}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value === selectedValue ? '' : option.value)}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary ring-offset-2 ring-offset-background transition-all duration-200',
              selectedValue === option.value ? 'ring-2 ring-primary' : 'ring-1 ring-border'
            )}
            title={option.label}
          >
            <Image
              src={option.imageUrl}
              alt={option.label}
              fill
              sizes="(max-width: 768px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={option.dataAiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <span className="absolute bottom-1.5 left-1.5 right-1.5 text-xs font-semibold text-white truncate text-left">
                {option.label}
            </span>
            {selectedValue === option.value && (
              <div className="absolute top-1.5 right-1.5 text-primary-foreground bg-primary rounded-full p-0.5 shadow-lg">
                <CheckCircle size={18} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
