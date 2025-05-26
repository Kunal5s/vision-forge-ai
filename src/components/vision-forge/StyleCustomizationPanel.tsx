'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { STYLES, MOODS, LIGHTING_OPTIONS, COLOR_OPTIONS } from '@/lib/constants';
import type { StyleType, MoodType, LightingType, ColorType } from '@/lib/constants';

interface StyleCustomizationPanelProps {
  selectedStyle: StyleType | undefined;
  setSelectedStyle: Dispatch<SetStateAction<StyleType | undefined>>;
  selectedMood: MoodType | undefined;
  setSelectedMood: Dispatch<SetStateAction<MoodType | undefined>>;
  selectedLighting: LightingType | undefined;
  setSelectedLighting: Dispatch<SetStateAction<LightingType | undefined>>;
  selectedColor: ColorType | undefined;
  setSelectedColor: Dispatch<SetStateAction<ColorType | undefined>>;
}

export function StyleCustomizationPanel({
  selectedStyle,
  setSelectedStyle,
  selectedMood,
  setSelectedMood,
  selectedLighting,
  setSelectedLighting,
  selectedColor,
  setSelectedColor,
}: StyleCustomizationPanelProps) {
  
  const createSelect = <T extends string>(
    label: string,
    id: string,
    options: readonly T[],
    value: T | undefined,
    onChange: (value: T | undefined) => void
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</Label>
      <Select
        value={value}
        onValueChange={(val) => onChange(val === 'none' ? undefined : val as T)}
      >
        <SelectTrigger id={id} className="w-full futuristic-glow-button bg-input hover:bg-input/80">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="none">None</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {createSelect("Style", "style-select", STYLES, selectedStyle, setSelectedStyle)}
      {createSelect("Mood", "mood-select", MOODS, selectedMood, setSelectedMood)}
      {createSelect("Lighting", "lighting-select", LIGHTING_OPTIONS, selectedLighting, setSelectedLighting)}
      {createSelect("Color", "color-select", COLOR_OPTIONS, selectedColor, setSelectedColor)}
    </div>
  );
}
