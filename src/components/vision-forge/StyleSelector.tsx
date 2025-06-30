
'use client';

import { cn } from '@/lib/utils';
import { 
  CheckCircle, Camera, Film, Sparkles, Castle, Cuboid, Square, Paintbrush, 
  PenLine, MessageSquare, Triangle, Send, Sticker, CloudLightning, Cloud, 
  Zap, Moon, Smile, Ghost, Feather, Projector, Sunrise, CircleDot, Sun, 
  CircleOff, Palette, Mountain, Flame, Snowflake, Dices, Pizza, Bot, BrainCircuit,
  Pencil, Drama, SunMedium, CloudFog, CloudSun, LandPlot, Thermometer, Droplets
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
  '3d': <Dices size={32} />,
  '8-bit': <Square size={32} />,
  'analogue': <Camera size={32} />,
  'anime': <Sparkles size={32} />,
  'cartoon': <Smile size={32} />,
  'collage': <Sticker size={32} />,
  'cookie': <Pizza size={32} />,
  'crayon': <Pencil size={32} />,
  'doodle': <PenLine size={32} />,
  'dough': <Bot size={32} />,
  'felt': <Feather size={32} />,
  'illustrated': <Paintbrush size={32} />,
  'marker': <Pencil size={32} />,
  'mechanical': <BrainCircuit size={32} />,
  'painting': <Paintbrush size={32} />,
  'paper': <Feather size={32} />,
  'pin': <Triangle size={32} />,
  'plushie': <Bot size={32} />,
  'realistic': <Camera size={32} />,
  'tattoo': <Drama size={32} />,
  'woodblock': <Square size={32} />,

  // Moods
  'sweets': <Pizza size={32} />,
  'classical': <Castle size={32} />,
  'cyberpunk': <Zap size={32} />,
  'dreamy': <Cloud size={32} />,
  'glowy': <Sparkles size={32} />,
  'gothic': <Moon size={32} />,
  'kawaii': <Smile size={32} />,
  'mystical': <CloudFog size={32} />,
  'trippy': <Dices size={32} />,
  'tropical': <CloudSun size={32} />,
  'steampunk': <BrainCircuit size={32} />,
  'wasteland': <LandPlot size={32} />,

  // Lighting
  'bright': <SunMedium size={32} />,
  'dark': <Moon size={32} />,
  'neon': <Zap size={32} />,
  'sunset': <Sunrise size={32} />,
  'misty': <CloudFog size={32} />,
  'ethereal': <Feather size={32} />,

  // Colours
  'cool': <Snowflake size={32} />,
  'earthy': <Mountain size={32} />,
  'indigo': <Droplets size={32} />,
  'infrared': <Flame size={32} />,
  'pastel': <Palette size={32} />,
  'warm': <Thermometer size={32} />,
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
              {iconMap[option.value] || <Square size={32} />}
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
