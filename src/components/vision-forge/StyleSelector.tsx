
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, Camera, Film, Sparkles, Castle, Cuboid, Square, Paintbrush, 
  PenLine, MessageSquare, Triangle, Send, Sticker, CloudLightning, Cloud, 
  Zap, Moon, Smile, Ghost, Feather, Projector, Sunrise, CircleDot, Sun, 
  CircleOff, Palette, Mountain, Flame, Snowflake 
} from 'lucide-react';
import type { StyleOption } from '@/lib/constants';

interface StyleSelectorProps {
  title: string;
  options: StyleOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  // Styles
  'photographic': <Camera size={32} className="text-black/50" />,
  'cinematic': <Film size={32} className="text-black/50" />,
  'anime': <Sparkles size={32} className="text-black/50" />,
  'fantasy art': <Castle size={32} className="text-black/50" />,
  '3d render': <Cuboid size={32} className="text-black/50" />,
  'pixel art': <Square size={32} className="text-black/50" />,
  'watercolor': <Paintbrush size={32} className="text-black/50" />,
  'line art': <PenLine size={32} className="text-black/50" />,
  'comic book': <MessageSquare size={32} className="text-black/50" />,
  'low poly': <Triangle size={32} className="text-black/50" />,
  'origami': <Send size={32} className="text-black/50" />,
  'sticker': <Sticker size={32} className="text-black/50" />,
  // Moods
  'dramatic': <CloudLightning size={32} className="text-black/50" />,
  'dreamy': <Cloud size={32} className="text-black/50" />,
  'energetic': <Zap size={32} className="text-black/50" />,
  'mysterious': <Moon size={32} className="text-black/50" />,
  'cheerful': <Smile size={32} className="text-black/50" />,
  'eerie': <Ghost size={32} className="text-black/50" />,
  // Lighting
  'soft': <Feather size={32} className="text-black/50" />,
  'studio': <Projector size={32} className="text-black/50" />,
  'neon': <Zap size={32} className="text-black/50" />,
  'golden hour': <Sunrise size={32} className="text-black/50" />,
  'backlit': <CircleDot size={32} className="text-black/50" />,
  // Colours
  'vibrant': <Sun size={32} className="text-black/50" />,
  'monochromatic': <CircleOff size={32} className="text-black/50" />,
  'pastel': <Palette size={32} className="text-black/50" />,
  'earthy': <Mountain size={32} className="text-black/50" />,
  'warm': <Flame size={32} className="text-black/50" />,
  'cool': <Snowflake size={32} className="text-black/50" />,
};


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
            <div className="absolute inset-0 flex items-center justify-center">
              {iconMap[option.value]}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
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
