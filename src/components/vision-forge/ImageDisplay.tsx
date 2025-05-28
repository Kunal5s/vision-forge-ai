
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Copy, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';
import { FuturisticPanel } from './FuturisticPanel';
import { useEffect, useState } from 'react';

interface ImageDisplayProps {
  imageUrl: string | null; // Changed from imageUrls: string[]
  prompt: string;
  aspectRatio: string;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onCopyPrompt: () => void;
}

export function ImageDisplay({
  imageUrl,
  prompt,
  aspectRatio,
  isLoading,
  error,
  onRegenerate,
  onCopyPrompt,
}: ImageDisplayProps) {
  
  const [animateImage, setAnimateImage] = useState(false);

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

  const handleDownloadImage = () => {
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
    if (imageUrl && !isLoading && !error) {
      setAnimateImage(true);
      const timer = setTimeout(() => {
        setAnimateImage(false);
      }, 5000); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [imageUrl, isLoading, error]);


  return (
    <FuturisticPanel className="flex flex-col gap-4 h-full">
      <div className={cn(
          "relative w-full rounded-lg border border-border/50 bg-muted/30 flex items-center justify-center min-h-[300px] md:min-h-[400px] overflow-hidden group", // Added group here
          getAspectRatioClass(aspectRatio),
          {'newly-generated-image-animate': animateImage}
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
            <p className="font-semibold">Error Generating Image</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!isLoading && !error && imageUrl && (
          <>
            <Image
              key={imageUrl.slice(-20)} // Use part of URL for key
              src={imageUrl}
              alt={prompt || 'Generated AI image'}
              layout="fill"
              objectFit="contain"
              className="transition-opacity duration-500 opacity-0 data-[loaded=true]:opacity-100 bg-muted/10"
              data-loaded="false"
              onLoadingComplete={(img) => img.setAttribute('data-loaded', 'true')}
              data-ai-hint="generated art"
            />
            <Button 
              onClick={handleDownloadImage} 
              variant="ghost" 
              size="icon" 
              className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white hover:text-white opacity-0 group-hover:opacity-100 transition-opacity futuristic-glow-button"
              title="Download Image"
            >
              <Download size={18} />
            </Button>
          </>
        )}
        {!isLoading && !error && !imageUrl && (
           <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 p-4 text-center">
            <ImageIcon size={64} />
            <p className="mt-2 text-lg">Your vision will appear here</p>
          </div>
        )}
      </div>
      {(imageUrl || prompt) && !isLoading && !error && (
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
