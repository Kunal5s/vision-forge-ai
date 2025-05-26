'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Copy, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';
import { FuturisticPanel } from './FuturisticPanel';

interface ImageDisplayProps {
  imageUrl: string | null;
  prompt: string;
  aspectRatio: string;
  isLoading: boolean;
  error: string | null;
  onDownload: () => void;
  onRegenerate: () => void;
  onCopyPrompt: () => void;
}

export function ImageDisplay({
  imageUrl,
  prompt,
  aspectRatio,
  isLoading,
  error,
  onDownload,
  onRegenerate,
  onCopyPrompt,
}: ImageDisplayProps) {
  
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

  return (
    <FuturisticPanel className="flex flex-col gap-4 h-full">
      <div className={cn("relative w-full rounded-lg overflow-hidden border border-border/50 bg-muted/30 flex items-center justify-center min-h-[300px] md:min-h-[400px]", getAspectRatioClass(aspectRatio))}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
            <LoadingSpinner size={64} />
            <p className="mt-4 text-lg font-semibold text-foreground animate-pulse">Forging Vision...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4">
            <AlertTriangle size={48} className="mb-2" />
            <p className="font-semibold">Error Generating Image</p>
            <p className="text-sm text-center">{error}</p>
          </div>
        )}
        {!isLoading && !error && imageUrl && (
          <Image
            src={imageUrl}
            alt={prompt || 'Generated AI image'}
            layout="fill"
            objectFit="contain"
            className="transition-opacity duration-500 opacity-0 data-[loaded=true]:opacity-100"
            data-loaded="false"
            onLoadingComplete={(img) => img.setAttribute('data-loaded', 'true')}
            data-ai-hint="abstract art"
          />
        )}
        {!isLoading && !error && !imageUrl && (
           <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <ImageIcon size={64} />
            <p className="mt-2 text-lg">Your vision will appear here</p>
          </div>
        )}
      </div>
      {imageUrl && !isLoading && !error && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={onDownload} variant="outline" className="futuristic-glow-button">
            <Download size={18} className="mr-2" />
            Download
          </Button>
          <Button onClick={onRegenerate} variant="outline" className="futuristic-glow-button">
            <RefreshCw size={18} className="mr-2" />
            Regenerate
          </Button>
          <Button onClick={onCopyPrompt} variant="outline" className="futuristic-glow-button">
            <Copy size={18} className="mr-2" />
            Copy Prompt
          </Button>
        </div>
      )}
    </FuturisticPanel>
  );
}
