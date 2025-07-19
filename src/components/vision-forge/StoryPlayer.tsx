
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Story } from '@/lib/stories';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Pause, Play, X, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface StoryPlayerProps {
  story: Story;
  isPreview?: boolean;
  onClose?: () => void;
}


export function StoryPlayer({ story, isPreview = false, onClose }: StoryPlayerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextPage = useCallback(() => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else if (!isPreview) {
        window.location.href = '/stories'; // Redirect to stories list when the last slide finishes
    }
  }, [currentPage, story.pages.length, isPreview]);

  const prevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  useEffect(() => {
    setProgress(0); // Reset progress when page changes
  }, [currentPage]);
  
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          nextPage();
          return 100;
        }
        return prev + 1;
      });
    }, 50); // 50ms interval for a 5-second story page

    return () => clearInterval(timer);
  }, [currentPage, isPaused, nextPage]);

  const page = story.pages[currentPage];

  const handleClose = isPreview ? onClose : () => window.location.href = '/';

  if (!page) {
    // Handle case where pages are empty or currentPage is out of bounds
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
      <div className="relative w-full h-full max-w-[420px] max-h-[85vh] aspect-[9/16] bg-stone-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Background Image */}
        <Image
          src={page.url}
          alt={page.content?.title || 'Story page'}
          layout="fill"
          objectFit="cover"
          className="z-0 opacity-80"
          priority
          data-ai-hint={page.dataAiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50 z-10" />

        {/* Header with Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-2 z-20">
          <div className="flex items-center gap-1">
            {story.pages.map((_, index) => (
              <div key={index} className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                {index < currentPage && <div className="h-full w-full bg-white" />}
                {index === currentPage && <Progress value={progress} className="h-1 bg-white" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
                {story.logo && <Image src={story.logo} alt={story.title} width={32} height={32} className="rounded-full object-contain" data-ai-hint={'logo'}/>}
                <span className="text-white text-sm font-bold">{story.title}</span>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={handleClose}>
                    <X size={24} />
                </Button>
             </div>
          </div>
        </div>

        {/* Navigation Overlays */}
        <div
          className="absolute left-0 top-0 h-full w-1/2 z-30"
          onClick={prevPage}
        />
        <div
          className="absolute right-0 top-0 h-full w-1/2 z-30"
          onClick={nextPage}
        />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col items-center text-center">
            {page.content?.title && 
                <p className="text-white font-semibold text-lg drop-shadow-lg bg-black/40 backdrop-blur-sm p-3 rounded-lg mb-4">
                    {page.content.title}
                </p>
            }
            
            {story.websiteUrl && (
                <a href={story.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-4">
                    <Button variant="secondary" className="bg-white/90 text-black hover:bg-white rounded-full">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Visit Website
                    </Button>
                </a>
            )}
        </div>


        {/* Chevron Navigation Buttons */}
        <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); prevPage(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-40 text-white bg-black/30 hover:bg-black/50"
            disabled={currentPage === 0}
        >
            <ChevronLeft />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); nextPage(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-40 text-white bg-black/30 hover:bg-black/50"
            disabled={currentPage === story.pages.length - 1}
        >
            <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
