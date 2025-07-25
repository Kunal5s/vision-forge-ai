
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Copy, RefreshCw, AlertTriangle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FuturisticPanel } from './FuturisticPanel';
import { useEffect, useState } from 'react';
import type { Plan } from '@/types';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';


interface ImageDisplayProps {
  imageUrls: string[];
  prompt: string;
  aspectRatio: string;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onCopyPrompt: () => void;
  userPlan: Plan;
  imageCount: number;
}

const ImageLoadingSkeleton = ({ aspectRatio, imageCount }: { aspectRatio: string, imageCount: number }) => {
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '3:2': return 'aspect-[3/2]';
      case '2:3': return 'aspect-[2/3]';
      case '9:16': return 'aspect-[9/16]';
      default: return 'aspect-square';
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-2">
      <div className={cn(
          "w-full h-full grid gap-2",
          imageCount === 1 ? 'grid-cols-1' : 'grid-cols-2',
          imageCount > 4 && 'md:grid-cols-3',
        )}
      >
        {Array.from({ length: imageCount }).map((_, index) => (
          <div 
            key={index}
            className={cn(
              "relative rounded-md overflow-hidden bg-muted/50 flex items-center justify-center",
              getAspectRatioClass(aspectRatio)
            )}
          >
            <Sparkles className="h-12 w-12 text-foreground/50 animate-pulse" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-lg font-semibold text-foreground animate-pulse">Forging Vision...</p>
    </div>
  );
};


export function ImageDisplay({
  imageUrls,
  prompt,
  aspectRatio,
  isLoading,
  error,
  onRegenerate,
  onCopyPrompt,
  userPlan,
  imageCount
}: ImageDisplayProps) {
  
  const { toast } = useToast();
  // State to track individual image loading status (loading, loaded, error)
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});


  useEffect(() => {
    // When new image URLs are received, initialize their states to 'loading'
    if (imageUrls && imageUrls.length > 0) {
      const initialStates = imageUrls.reduce((acc, url, index) => {
        // Create a unique key for each image to handle potential duplicate URLs
        acc[`${url}-${index}`] = 'loading';
        return acc;
      }, {} as Record<string, 'loading' | 'loaded' | 'error'>);
      setImageStates(initialStates);
    }
  }, [imageUrls]);

  // Handler for when an image successfully loads
  const handleImageLoad = (key: string) => {
    setImageStates(prev => ({ ...prev, [key]: 'loaded' }));
  };

  // Handler for when an image fails to load
  const handleImageError = (key: string) => {
    setImageStates(prev => ({ ...prev, [key]: 'error' }));
  };

  // Utility to get the correct Tailwind aspect ratio class
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '3:2': return 'aspect-[3/2]';
      case '2:3': return 'aspect-[2/3]';
      case '9:16': return 'aspect-[9/16]';
      case '5:4': return 'aspect-[5/4]';
      case '21:9': return 'aspect-[21/9]';
      case '2:1': return 'aspect-[2/1]';
      case '3:1': return 'aspect-[3/1]';
      default: return 'aspect-square';
    }
  };
  
  // Handler to download all successfully loaded images as a ZIP
  const handleDownloadAll = async () => {
    const loadedImageUrls = imageUrls.filter((url, index) => imageStates[`${url}-${index}`] === 'loaded');

    if (loadedImageUrls.length < 1) {
        toast({
            title: 'No Images to Download',
            description: 'None of the images loaded successfully.',
            variant: 'destructive',
        });
        return;
    }

    const { id, update, dismiss } = toast({
      title: 'Preparing Download',
      description: `Zipping your ${loadedImageUrls.length} image(s), please wait...`,
    });

    try {
      const zip = new JSZip();
      
      const imagePromises = loadedImageUrls.map(async (url, index) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image ${index + 1}`);
        }
        const blob = await response.blob();
        const extension = blob.type.split('/')[1] || 'png';
        zip.file(`imagenbrainai_${index + 1}.${extension}`, blob);
      });

      await Promise.all(imagePromises);

      const content = await zip.generateAsync({ type: 'blob' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      const safePrompt = prompt.substring(0, 20).replace(/\s+/g, '_');
      link.download = `imagenbrainai_${safePrompt}_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      update({ id, title: 'Download Started!', description: 'Your ZIP file is being downloaded.' });
    } catch (e: any) {
      console.error('Failed to create zip file:', e);
      update({ id, title: 'Error', description: `Could not prepare download: ${e.message}`, variant: 'destructive' });
    } finally {
      setTimeout(() => dismiss(id), 5000);
    }
  };

  // Handler to download a single image
  const handleDownloadImage = async (imageUrl: string) => {
    if (!imageUrl) return;

    const { id, update, dismiss } = toast({
      title: 'Preparing Download',
      description: 'Your image is being prepared...',
    });

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Network response was not ok.');
        
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const safePrompt = prompt.substring(0, 20).replace(/\s+/g, '_');
        const extension = blob.type.split('/')[1] || 'png';
        link.download = `imagenbrainai_${safePrompt}_${Date.now()}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        update({ id, title: 'Download Started!', description: 'Your image is on its way.' });

    } catch (e) {
        console.error('Download failed, attempting fallback:', e);
        try {
            // Fallback for cross-origin issues: open the image in a new tab.
            const link = document.createElement('a');
            link.href = imageUrl;
            link.target = '_blank'; // Open in a new tab, user can save from there.
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            update({ id, title: 'Download Started!', description: 'Your image opened in a new tab. You can save it from there.' });
        } catch (finalError) {
            console.error("Fallback download also failed:", finalError);
            update({ id, title: 'Download Failed', description: 'Could not download the image. Please try right-clicking to save.', variant: 'destructive' });
        }
    } finally {
        setTimeout(() => dismiss(id), 5000);
    }
  };

  const hasImages = imageUrls.length > 0;

  return (
    <FuturisticPanel className="flex flex-col gap-4 h-full">
      <div className={cn(
          "w-full rounded-lg bg-muted/30 flex items-center justify-center min-h-[300px] md:min-h-[400px] overflow-hidden p-2 relative border"
        )}
      >
        {isLoading && <ImageLoadingSkeleton aspectRatio={aspectRatio} imageCount={imageCount} />}

        {error && !isLoading && !hasImages && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle size={48} className="mb-2 text-destructive" />
            <p className="font-semibold text-foreground">Error Generating Images</p>
            <p className="text-sm max-w-md mx-auto whitespace-pre-wrap text-muted-foreground">{error}</p>
          </div>
        )}
        {!isLoading && hasImages && (
          <div className={cn(
            "w-full h-full grid gap-2",
            imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
            imageUrls.length > 4 && 'md:grid-cols-3',
            )}>
            {imageUrls.map((url, index) => {
                const key = `${url}-${index}`;
                const state = imageStates[key];

                return (
                  <div key={key} className={cn("relative rounded-md overflow-hidden bg-muted/30 flex items-center justify-center", getAspectRatioClass(aspectRatio))}>
                    {(state === 'loading' || state === 'error') && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
                          <Sparkles className="h-8 w-8 text-foreground/50 animate-pulse" />
                        </div>
                    )}

                    <Image
                        src={url}
                        alt={`${prompt || 'Generated AI image'} - variation ${index + 1}`}
                        layout="fill"
                        objectFit="contain"
                        className={cn(
                            "transition-opacity duration-500 ease-in-out", 
                            state === 'loaded' ? 'opacity-100' : 'opacity-0'
                        )}
                        onLoad={() => handleImageLoad(key)}
                        onError={() => handleImageError(key)}
                        data-ai-hint="generated art"
                      />

                      {state === 'loaded' && (
                        <Button 
                          onClick={() => handleDownloadImage(url)} 
                          variant="default" 
                          size="icon" 
                          className="absolute bottom-2 right-2 bg-primary/80 backdrop-blur-sm text-primary-foreground hover:bg-primary transition-all z-20 h-8 w-8"
                          title="Download Image"
                        >
                          <Download size={16} />
                        </Button>
                      )}
                  </div>
                )
            })}
          </div>
        )}
        {!isLoading && !hasImages && !error && (
           <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 p-4 text-center">
            <ImageIcon size={64} />
            <h3 className="mt-4 text-lg font-semibold">Your generated images will appear here.</h3>
            <p className="mt-1 text-sm">Enter a prompt and adjust your settings to begin.</p>
          </div>
        )}
      </div>
      {(hasImages || prompt) && !isLoading && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={onRegenerate} variant="outline" className="transition-shadow hover:shadow-lg hover:shadow-accent/20" disabled={!prompt}>
            <RefreshCw size={18} className="mr-2" />
            Regenerate
          </Button>
          <Button onClick={onCopyPrompt} variant="outline" className="transition-shadow hover:shadow-lg hover:shadow-accent/20" disabled={!prompt}>
            <Copy size={18} className="mr-2" />
            Copy Prompt
          </Button>
          {hasImages && (
             <Button onClick={handleDownloadAll} variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-shadow hover:shadow-lg hover:shadow-primary/20">
                <Download size={18} className="mr-2" />
                Download All ({imageUrls.filter((url, index) => imageStates[`${url}-${index}`] === 'loaded').length})
            </Button>
          )}
        </div>
      )}
    </FuturisticPanel>
  );
}
