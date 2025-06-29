
'use client';

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
  'photographic': <Camera size={32} />,
  'cinematic': <Film size={32} />,
  'anime': <Sparkles size={32} />,
  'fantasy art': <Castle size={32} />,
  '3d render': <Cuboid size={32} />,
  'pixel art': <Square size={32} />,
  'watercolor': <Paintbrush size={32} />,
  'line art': <PenLine size={32} />,
  'comic book': <MessageSquare size={32} />,
  'low poly': <Triangle size={32} />,
  'origami': <Send size={32} />,
  'sticker': <Sticker size={32} />,
  // Moods
  'dramatic': <CloudLightning size={32} />,
  'dreamy': <Cloud size={32} />,
  'energetic': <Zap size={32} />,
  'mysterious': <Moon size={32} />,
  'cheerful': <Smile size={32} />,
  'eerie': <Ghost size={32} />,
  // Lighting
  'soft': <Feather size={32} />,
  'studio': <Projector size={32} />,
  'neon': <Zap size={32} />,
  'golden hour': <Sunrise size={32} />,
  'backlit': <CircleDot size={32} />,
  'dramatic lighting': <CloudLightning size={32} />,
  // Colours
  'vibrant': <Sun size={32} />,
  'monochromatic': <CircleOff size={32} />,
  'pastel': <Palette size={32} />,
  'earthy': <Mountain size={32} />,
  'warm': <Flame size={32} />,
  'cool': <Snowflake size={32} />,
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
              'flex flex-col items-center justify-center p-2 text-center bg-muted/50 hover:bg-muted',
              selectedValue === option.value ? 'ring-2 ring-primary bg-primary/10' : 'ring-1 ring-border'
            )}
            title={option.label}
          >
            <div className="text-muted-foreground group-hover:text-foreground transition-colors">
              {iconMap[option.value]}
            </div>
            <span className="mt-2 text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
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
