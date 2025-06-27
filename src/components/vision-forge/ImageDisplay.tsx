
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Copy, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
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
}

export function ImageDisplay({
  imageUrls,
  prompt,
  aspectRatio,
  isLoading,
  error,
  onRegenerate,
  onCopyPrompt,
  userPlan,
}: ImageDisplayProps) {
  
  const { toast } = useToast();
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});


  useEffect(() => {
    if (imageUrls && imageUrls.length > 0) {
      const initialStates = imageUrls.reduce((acc, url, index) => {
        acc[`${url}-${index}`] = 'loading';
        return acc;
      }, {} as Record<string, 'loading' | 'loaded' | 'error'>);
      setImageStates(initialStates);
    }
  }, [imageUrls]);

  const handleImageLoad = (key: string) => {
    setImageStates(prev => ({ ...prev, [key]: 'loaded' }));
  };

  const handleImageError = (key: string) => {
    // Silently handle the error by updating state, which will hide the image element
    console.log(`Image failed to load, hiding element: ${key}`);
    setImageStates(prev => ({ ...prev, [key]: 'error' }));
  };


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
      // This fallback attempts a direct download link click, which might navigate
      // instead of downloading on some browser/server configs, but it won't open a new tab.
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        const safePrompt = prompt.substring(0, 20).replace(/\s+/g, '_');
        const extension = imageUrl.split('.').pop()?.split('?')[0] || 'png';
        link.download = `imagenbrainai_fallback_${safePrompt}_${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        update({ id, title: 'Download Started!', description: 'Using fallback download method.' });
      } catch (finalError) {
        console.error("Fallback download also failed:", finalError);
        update({ id, title: 'Download Failed', description: 'Could not download the image. Please try right-clicking to save.', variant: 'destructive' });
      }
    } finally {
        setTimeout(() => dismiss(id), 5000);
    }
  };

  return (
    <FuturisticPanel className="flex flex-col gap-4 h-full">
      <div className={cn(
          "w-full rounded-lg bg-muted/10 flex items-center justify-center min-h-[300px] md:min-h-[400px] overflow-hidden p-1"
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
            <LoadingSpinner size={64} />
            <p className="mt-4 text-lg font-semibold text-foreground animate-pulse">Forging Vision...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle size={48} className="mb-2 text-destructive" />
            <p className="font-semibold text-foreground">Error Generating Images</p>
            <p className="text-sm max-w-md mx-auto whitespace-pre-wrap text-muted-foreground">{error}</p>
          </div>
        )}
        {!isLoading && !error && imageUrls.length > 0 && (
          <div className={cn(
            "w-full h-full",
             imageUrls.length > 1 ? "grid grid-cols-2 gap-1" : ""
            )}>
            {imageUrls.map((url, index) => {
                const key = `${url}-${index}`;
                const state = imageStates[key];

                return (
                  <div key={key} className={cn("relative group rounded-md overflow-hidden bg-muted/20", getAspectRatioClass(aspectRatio))}>
                    {state === 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
                          <LoadingSpinner size={32} />
                        </div>
                    )}
                    
                    {state !== 'error' && (
                      <Image
                          src={url}
                          alt={`${prompt || 'Generated AI image'} - variation ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className={cn("transition-opacity duration-500", state === 'loaded' ? 'opacity-100' : 'opacity-0')}
                          onLoad={() => handleImageLoad(key)}
                          onError={() => handleImageError(key)}
                          data-ai-hint="generated art"
                        />
                    )}
                      {state === 'loaded' && (
                        <Button 
                          onClick={() => handleDownloadImage(url)} 
                          variant="default" 
                          size="icon" 
                          className="absolute bottom-2 right-2 bg-primary/70 backdrop-blur-sm text-primary-foreground hover:bg-primary opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all futuristic-glow-button z-20"
                          title="Download Image"
                        >
                          <Download size={18} />
                        </Button>
                      )}
                  </div>
                )
            })}
          </div>
        )}
        {!isLoading && !error && imageUrls.length === 0 && (
           <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 p-4 text-center">
            <ImageIcon size={64} />
            <p className="mt-2 text-lg">Your vision will appear here</p>
          </div>
        )}
      </div>
      {(imageUrls.length > 0 || prompt) && !isLoading && !error && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={onRegenerate} variant="outline" className="futuristic-glow-button">
            <RefreshCw size={18} className="mr-2" />
            Regenerate
          </Button>
          <Button onClick={onCopyPrompt} variant="outline" className="futuristic-glow-button" disabled={!prompt}>
            <Copy size={18} className="mr-2" />
            Copy Prompt
          </Button>
          {(userPlan === 'pro' || userPlan === 'mega') && imageUrls.length > 1 && (
             <Button onClick={handleDownloadAll} variant="default" className="futuristic-glow-button-primary bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download size={18} className="mr-2" />
                Download All
            </Button>
          )}
        </div>
      )}
    </FuturisticPanel>
  );
}
