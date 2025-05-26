
// src/app/edit/page.tsx
"use client";

import type { Metadata } from 'next';
import Image from 'next/image';
import { useState, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, UploadCloud, Palette, Crop, RotateCcw, Wand2, Text, Sticker, Download, Save } from 'lucide-react';
import { FuturisticPanel } from '@/components/vision-forge/FuturisticPanel';

// Since metadata can't be dynamic in client components easily without specific Next.js patterns,
// we'll set a static one. For dynamic metadata based on loaded image, further setup would be needed.
// export const metadata: Metadata = {
//   title: 'Image Editor | VisionForge AI',
//   description: 'Edit your images with a powerful suite of tools on VisionForge AI.',
// };

// Placeholder for actual editing tool categories and features
const editingToolCategories = [
  { 
    name: "Basic Adjustments", 
    icon: <Palette size={20} className="mr-2 text-primary" />,
    features: ["Brightness", "Contrast", "Saturation", "Hue", "Sharpness", "Blur"] 
  },
  { 
    name: "Transform", 
    icon: <Crop size={20} className="mr-2 text-primary" />,
    features: ["Crop", "Rotate", "Flip", "Resize", "Aspect Ratio"] 
  },
  { 
    name: "Filters & Effects", 
    icon: <Wand2 size={20} className="mr-2 text-primary" />,
    features: ["Grayscale", "Sepia", "Invert", "Vintage", "Pixelate"] 
  },
  { 
    name: "Annotation", 
    icon: <Text size={20} className="mr-2 text-primary" />,
    features: ["Add Text", "Draw", "Shapes"] 
  },
  {
    name: "Overlays",
    icon: <Sticker size={20} className="mr-2 text-primary" />,
    features: ["Stickers", "Watermark", "Frames"]
  }
];


export default function ImageEditorPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Effect to set page title (client-side alternative for simpler cases)
  useEffect(() => {
    document.title = 'Image Editor | VisionForge AI';
  }, []);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please upload an image (PNG, JPG, GIF, WEBP).');
        setUploadedImage(null);
        setImageFile(null);
        setFileName(null);
        return;
      }
      // Max file size: 10MB
      if (file.size > 10 * 1024 * 1024) {
         setError('File is too large. Maximum size is 10MB.');
         setUploadedImage(null);
         setImageFile(null);
         setFileName(null);
        return;
      }

      setError(null);
      setImageFile(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Placeholder function for applying an edit
  const applyEdit = (feature: string) => {
    console.log(`Applying edit: ${feature} to ${imageFile?.name}`);
    // In a real editor, this would trigger image processing logic
    alert(`Feature "${feature}" selected. Implementation pending.`);
  };
  
  // Placeholder function for saving image
  const handleSaveImage = () => {
    if (!uploadedImage) return;
    alert("Save functionality would be implemented here. For now, you can right-click to save the displayed image if your browser allows.");
    // For actual download, you'd convert canvas content to data URL / blob and trigger download
  };


  return (
    <main className="container mx-auto py-8 px-4">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">
          Image <span className="text-accent">Editor</span>
        </h1>
        <p className="mt-2 text-lg text-foreground/80">Refine your visuals with precision and creativity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
        {/* Editing Tools Panel (Left) */}
        <Card className="lg:col-span-4 xl:col-span-3 glassmorphism-panel flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Wand2 className="mr-2 text-accent" /> Editing Tools</CardTitle>
            <CardDescription className="text-sm">Select a tool to start editing.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {uploadedImage ? (
                <div className="space-y-6">
                  {editingToolCategories.map(category => (
                    <div key={category.name}>
                      <h3 className="text-md font-semibold mb-2 flex items-center text-foreground/90">
                        {category.icon} {category.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {category.features.map(feature => (
                          <Button 
                            key={feature} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs justify-start futuristic-glow-button"
                            onClick={() => applyEdit(feature)}
                          >
                            {feature}
                          </Button>
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
                  <Save size={18} className="mr-2" /> Save Image
                </Button>
             </div>
           )}
        </Card>

        {/* Image Display and Upload Area (Right) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
          <FuturisticPanel className="flex-grow flex flex-col items-center justify-center">
            {!uploadedImage && (
              <div className="text-center p-8 space-y-4">
                <UploadCloud size={64} className="mx-auto text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Upload Your Image</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Drag and drop your image here, or click the button below to select a file. Max 10MB (PNG, JPG, GIF, WEBP).
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
                <div className="relative w-full max-w-3xl aspect-auto max-h-[calc(70vh-120px)]">
                  <Image
                    src={uploadedImage}
                    alt={fileName || "Uploaded image"}
                    layout="fill"
                    objectFit="contain"
                     data-ai-hint="user uploaded image"
                  />
                </div>
                 <div className="flex gap-2 mt-2">
                    <Button variant="outline" onClick={() => {setUploadedImage(null); setImageFile(null); setFileName(null); setError(null);}} className="futuristic-glow-button">
                      <RotateCcw size={18} className="mr-2"/> Upload New
                    </Button>
                  </div>
              </div>
            )}
          </FuturisticPanel>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Note: This is a foundational image editor setup. Many editing features are placeholders and require further implementation or integration of an image editing library.
          </p>
        </div>
      </div>
    </main>
  );
}

    