
// src/app/edit/page.tsx
"use client";

import Image from 'next/image';
import { useState, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, UploadCloud, Palette, Crop, RotateCcw, Wand2, Text, Sticker, Download, Save, Trash2, Sparkles } from 'lucide-react';
import { FuturisticPanel } from '@/components/vision-forge/FuturisticPanel';
import { cn } from '@/lib/utils';


// Define types for filters to manage their state
type AppliedFilter = "Grayscale" | "Sepia" | "Invert"; // Basic toggleable filters
const basicAdjustmentFilters = ["Brightness", "Contrast", "Saturation", "Hue", "Sharpness", "Blur"];
const transformFilters = ["Crop", "Rotate", "Flip", "Resize", "Aspect Ratio"];
const annotationFilters = ["Add Text", "Draw", "Shapes"];
const overlayFilters = ["Stickers", "Watermark", "Frames"];


interface EditingTool {
  name: string;
  type: 'toggle' | 'slider' | 'placeholder';
  category: string;
}

const initialEditingTools: EditingTool[] = [
  // Basic Adjustments
  { name: "Brightness", type: "slider", category: "Basic Adjustments" },
  ...["Contrast", "Saturation", "Hue", "Sharpness", "Blur"].map(f => ({ name: f, type: "placeholder" as "placeholder", category: "Basic Adjustments" })),
  // Transform
  ...transformFilters.map(f => ({ name: f, type: "placeholder" as "placeholder", category: "Transform" })),
  // Filters & Effects
  { name: "Grayscale", type: "toggle" as "toggle", category: "Filters & Effects" },
  { name: "Sepia", type: "toggle" as "toggle", category: "Filters & Effects" },
  { name: "Invert", type: "toggle" as "toggle", category: "Filters & Effects" },
  ...["Vintage", "Pixelate"].map(f => ({ name: f, type: "placeholder" as "placeholder", category: "Filters & Effects" })),
  // Annotation
  ...annotationFilters.map(f => ({ name: f, type: "placeholder" as "placeholder", category: "Annotation" })),
  // Overlays
  ...overlayFilters.map(f => ({ name: f, type: "placeholder" as "placeholder", category: "Overlays" })),
];

const editingToolCategoriesConfig = [
  { 
    name: "Basic Adjustments", 
    icon: <Palette size={20} className="mr-2 text-primary" />,
  },
  { 
    name: "Transform", 
    icon: <Crop size={20} className="mr-2 text-primary" />,
  },
  { 
    name: "Filters & Effects", 
    icon: <Wand2 size={20} className="mr-2 text-primary" />,
  },
  { 
    name: "Annotation", 
    icon: <Text size={20} className="mr-2 text-primary" />,
  },
  {
    name: "Overlays",
    icon: <Sticker size={20} className="mr-2 text-primary" />,
  }
];


export default function ImageEditorPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // State for CSS Filters
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isSepia, setIsSepia] = useState(false);
  const [isInverted, setIsInverted] = useState(false);
  const [brightness, setBrightness] = useState(100); // Percentage, 100 is normal
  
  const [imageStyles, setImageStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    document.title = 'Image Editor | Imagen BrainAi';
  }, []);

  // Update image style when filter states change
  useEffect(() => {
    const filters: string[] = [];
    if (isGrayscale) filters.push('grayscale(100%)');
    if (isSepia) filters.push('sepia(100%)');
    if (isInverted) filters.push('invert(100%)');
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    
    setImageStyles({ filter: filters.join(' ') || 'none' });
  }, [isGrayscale, isSepia, isInverted, brightness]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please upload an image (PNG, JPG, GIF, WEBP).');
        setUploadedImage(null); setImageFile(null); setFileName(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
         setError('File is too large. Maximum size is 10MB.');
         setUploadedImage(null); setImageFile(null); setFileName(null);
        return;
      }
      setError(null); setImageFile(file); setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        resetFilters(); // Reset filters for new image
      };
      reader.readAsDataURL(file);
    }
  };
  
  const applyFilterToggle = (filter: AppliedFilter) => {
    if (!uploadedImage) return;
    switch (filter) {
      case "Grayscale": setIsGrayscale(p => !p); break;
      case "Sepia": setIsSepia(p => !p); break;
      case "Invert": setIsInverted(p => !p); break;
    }
  };

  const handleBrightnessChange = (value: number[]) => {
    if (!uploadedImage) return;
    setBrightness(value[0]);
  };

  const resetFilters = () => {
    setIsGrayscale(false);
    setIsSepia(false);
    setIsInverted(false);
    setBrightness(100);
    setImageStyles({});
  };
  
  const handleSaveImage = () => {
    if (!uploadedImage) return;
    alert("Save functionality is a placeholder. Current visual changes are applied via CSS filters and won't be part of a direct image download. Advanced saving would require canvas manipulation.");
  };

  const getToolsForCategory = (categoryName: string) => {
    return initialEditingTools.filter(tool => tool.category === categoryName);
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">
          Image <span className="text-accent">Editor</span>
        </h1>
        <p className="mt-2 text-lg text-foreground/80">Refine your visuals. (Basic filters enabled, more features coming soon!)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
        <Card className="lg:col-span-4 xl:col-span-3 glassmorphism-panel flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Sparkles className="mr-2 text-accent" /> Editing Tools</CardTitle>
            <CardDescription className="text-sm">Select a tool to start editing.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {uploadedImage ? (
                <div className="space-y-6">
                  <Button onClick={resetFilters} variant="outline" className="w-full futuristic-glow-button">
                    <Trash2 size={16} className="mr-2" /> Reset All Filters
                  </Button>
                  {editingToolCategoriesConfig.map(category => (
                    <div key={category.name}>
                      <h3 className="text-md font-semibold mb-2 flex items-center text-foreground/90">
                        {category.icon} {category.name}
                      </h3>
                      <div className="space-y-3">
                        {getToolsForCategory(category.name).map(tool => (
                          <div key={tool.name}>
                            {tool.type === 'toggle' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn(
                                  "w-full text-xs justify-start futuristic-glow-button",
                                  (tool.name === "Grayscale" && isGrayscale) && "bg-accent/20 border-accent text-accent",
                                  (tool.name === "Sepia" && isSepia) && "bg-accent/20 border-accent text-accent",
                                  (tool.name === "Invert" && isInverted) && "bg-accent/20 border-accent text-accent"
                                )}
                                onClick={() => applyFilterToggle(tool.name as AppliedFilter)}
                              >
                                {tool.name}
                              </Button>
                            )}
                            {tool.name === "Brightness" && tool.type === 'slider' && (
                              <div className="space-y-2">
                                <Label htmlFor="brightness-slider" className="text-xs">Brightness: {brightness}%</Label>
                                <Slider
                                  id="brightness-slider"
                                  min={0}
                                  max={200}
                                  step={1}
                                  value={[brightness]}
                                  onValueChange={handleBrightnessChange}
                                  className="my-2"
                                />
                              </div>
                            )}
                            {tool.type === 'placeholder' && (
                               <Button 
                                key={tool.name} 
                                variant="outline" 
                                size="sm" 
                                className="text-xs justify-start futuristic-glow-button w-full"
                                onClick={() => alert(`Feature "${tool.name}" is a placeholder.`)}
                              >
                                {tool.name}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <UploadCloud size={48} className="mx-auto mb-3" />
                  <p>Upload an image to see available editing tools.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
           {uploadedImage && (
             <div className="p-4 border-t border-border/30">
                <Button onClick={handleSaveImage} className="w-full futuristic-glow-button-primary bg-primary hover:bg-primary/90" disabled={!uploadedImage}>
                  <Save size={18} className="mr-2" /> Save Image (Placeholder)
                </Button>
             </div>
           )}
        </Card>

        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
          <FuturisticPanel className="flex-grow flex flex-col items-center justify-center">
            {!uploadedImage && (
              <div className="text-center p-8 space-y-4">
                <UploadCloud size={64} className="mx-auto text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Upload Your Image</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Drag and drop, or click to select. Max 10MB (PNG, JPG, GIF, WEBP).
                </p>
                <div className="relative mt-4">
                   <Button asChild variant="default" size="lg" className="futuristic-glow-button-primary bg-primary hover:bg-primary/90 cursor-pointer">
                      <div>
                        <UploadCloud size={20} className="mr-2" /> Select Image
                      </div>
                   </Button>
                  <Input
                    id="imageUpload"
                    type="file"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-3 flex items-center justify-center gap-1">
                    <AlertTriangle size={16} /> {error}
                  </p>
                )}
              </div>
            )}

            {uploadedImage && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-4">
                 <p className="text-sm text-muted-foreground">Editing: <strong>{fileName || 'Uploaded Image'}</strong></p>
                <div className="relative w-full max-w-3xl max-h-[calc(70vh-120px)] overflow-hidden"> {/* Removed aspect-auto */}
                  <Image
                    src={uploadedImage}
                    alt={fileName || "Uploaded image"}
                    layout="fill"
                    objectFit="contain"
                    style={imageStyles} // Apply CSS filters here
                    className="transition-all duration-300" // Smooth transition for filter changes
                    data-ai-hint="user uploaded image"
                  />
                </div>
                 <div className="flex gap-2 mt-2">
                    <Button variant="outline" onClick={() => {setUploadedImage(null); setImageFile(null); setFileName(null); setError(null); resetFilters();}} className="futuristic-glow-button">
                      <RotateCcw size={18} className="mr-2"/> Upload New
                    </Button>
                  </div>
              </div>
            )}
          </FuturisticPanel>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Note: This image editor applies basic visual filters using CSS. More advanced editing features and true image saving are under development.
          </p>
        </div>
      </div>
    </main>
  );
}
