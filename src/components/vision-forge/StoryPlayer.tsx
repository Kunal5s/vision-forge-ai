
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Story } from '@/lib/stories';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, X, Link as LinkIcon, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface StoryPlayerProps {
  story: Story;
  isPreview?: boolean;
  onClose?: () => void;
}


export function StoryPlayer({ story, isPreview = false, onClose }: StoryPlayerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  const nextPage = useCallback(() => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
      setProgress(0);
    } else if (!isPreview) {
        window.location.href = '/stories'; // Redirect when the last slide finishes
    }
  }, [currentPage, story.pages.length, isPreview]);

  const prevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : 0));
    setProgress(0);
  };

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          nextPage();
          return 100;
        }
        return prev + (100 / (5000 / 50)); // 5 seconds duration
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentPage, isPaused, nextPage]);

  const page = story.pages[currentPage];

  const handleShare = async () => {
    const shareData = {
        title: story.title,
        text: story.seoDescription,
        url: window.location.href
    };
    if (navigator.share && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link Copied!",
            description: "The story link has been copied to your clipboard.",
        });
    }
  };

  const handleClose = isPreview ? onClose : () => window.location.href = '/';

  if (!page) {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center font-sans">
            <div className="relative w-full h-full max-w-[420px] max-h-[85vh] aspect-[9/16] bg-stone-900 rounded-lg overflow-hidden shadow-2xl p-4 text-white text-center flex flex-col justify-center">
                <p>No pages to display in this story.</p>
                 <Button variant="ghost" size="icon" className="text-white h-8 w-8 absolute top-4 right-4" onClick={handleClose}>
                    <X size={24} />
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center font-sans", isPreview ? 'w-full h-full' : 'fixed inset-0 bg-black')}>
      <div className="relative w-full h-full max-w-[420px] max-h-[85vh] aspect-[9/16] bg-stone-900 rounded-lg overflow-hidden shadow-2xl group">
        
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 z-30">
          <div className="flex items-center gap-1">
            {story.pages.map((_, index) => (
              <div key={index} className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-50 ease-linear"
                  style={{ width: `${index < currentPage ? 100 : index === currentPage ? progress : 0}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Images with Fade Transition */}
        {story.pages.map((p, index) => (
            <Image
                key={p.url}
                src={p.url}
                alt={p.content?.title || `Story page ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className={cn(
                    "z-0 transition-opacity duration-300",
                    index === currentPage ? 'opacity-100' : 'opacity-0'
                )}
                priority={index === 0}
                data-ai-hint={p.dataAiHint}
            />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pt-5">
            <div className="flex items-center gap-2">
                {story.logo && <Image src={story.logo} alt={story.title} width={40} height={40} className="rounded-lg object-contain bg-white/80 p-1" data-ai-hint={'logo'}/>}
            </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </Button>
                 <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={handleShare}>
                    <Send size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={handleClose}>
                    <X size={24} />
                </Button>
             </div>
        </div>
        
        {/* Navigation Overlays */}
        <div className="absolute top-0 left-0 h-full w-1/3 z-30" onClick={prevPage} />
        <div className="absolute top-0 right-0 h-full w-1/3 z-30" onClick={nextPage} />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col items-start text-left">
            {story.publishedDate && (
                 <div className="bg-black/40 backdrop-blur-sm p-2 rounded-md mb-2">
                    <p className="text-white font-medium text-xs">
                        {format(new Date(story.publishedDate), 'MMMM d, yyyy')}
                    </p>
                </div>
            )}
            
            {page.content?.title && 
                <h1 className="text-white font-bold text-2xl leading-tight drop-shadow-lg">
                    {page.content.title}
                </h1>
            }
            
            {story.websiteUrl && (
                <div className="w-full mt-4">
                  <a href={story.websiteUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button variant="secondary" className="bg-white/90 text-black hover:bg-white rounded-full w-full">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Visit Website
                      </Button>
                  </a>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
