
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Copy, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';
import { FuturisticPanel } from './FuturisticPanel';
import { useEffect, useState } from 'react';

interface ImageDisplayProps {
  imageUrls: string[];
  prompt: string;
  aspectRatio: string;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onCopyPrompt: () => void;
}

export function ImageDisplay({
  imageUrls,
  prompt,
  aspectRatio,
  isLoading,
  error,
  onRegenerate,
  onCopyPrompt,
}: ImageDisplayProps) {
  
  const [animateImages, setAnimateImages] = useState(false);

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

  const handleDownloadImage = (imageUrl: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const extension = imageUrl.split(';')[0].split('/')[1] || 'png';
    link.download = `visionforge_${prompt.substring(0,20).replace(/\s+/g, '_')}_${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (imageUrls.length > 0 && !isLoading && !error) {
      setAnimateImages(true);
      const timer = setTimeout(() => {
        setAnimateImages(false);
      }, 5000); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [imageUrls, isLoading, error]);


  return (
    <FuturisticPanel className="flex flex-col gap-4 h-full">
      <div className={cn(
          "w-full rounded-lg border border-border/50 bg-muted/30 flex items-center justify-center min-h-[300px] md:min-h-[400px] overflow-hidden p-2",
          {'newly-generated-image-animate': animateImages}
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
            <LoadingSpinner size={64} />
            <p className="mt-4 text-lg font-semibold text-foreground animate-pulse">Forging Vision...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4 text-center">
            <AlertTriangle size={48} className="mb-2" />
            <p className="font-semibold">Error Generating Images</p>
            <p className="text-sm max-w-md mx-auto">{error}</p>
          </div>
        )}
        {!isLoading && !error && imageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full h-full">
            {imageUrls.map((url, index) => (
              <div key={url.slice(-20) + index} className={cn("relative group rounded-md overflow-hidden bg-muted/10", getAspectRatioClass(aspectRatio))}>
                 <Image
                    src={url}
                    alt={`${prompt || 'Generated AI image'} - variation ${index + 1}`}
                    layout="fill"
                    objectFit="contain"
                    className="transition-opacity duration-500 opacity-0 data-[loaded=true]:opacity-100"
                    data-loaded="false"
                    onLoadingComplete={(img) => img.setAttribute('data-loaded', 'true')}
                    data-ai-hint="generated art"
                  />
                  <Button 
                    onClick={() => handleDownloadImage(url)} 
                    variant="ghost" 
                    size="icon" 
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white hover:text-white opacity-0 group-hover:opacity-100 transition-opacity futuristic-glow-button"
                    title="Download Image"
                  >
                    <Download size={18} />
                  </Button>
              </div>
            ))}
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
        </div>
      )}
    </FuturisticPanel>
  );
}
