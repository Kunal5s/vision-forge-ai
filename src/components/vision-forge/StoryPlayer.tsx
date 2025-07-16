
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Story } from '@/lib/stories';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export function StoryPlayer({ story }: { story: Story }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < story.pages.length - 1 ? prev + 1 : prev));
  }, [story.pages.length]);

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

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-sans">
      <div className="relative w-full h-full max-w-[400px] max-h-[85vh] aspect-[9/16] bg-stone-900 rounded-lg overflow-hidden shadow-2xl">
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
                <Image src={story.cover} alt={story.title} width={32} height={32} className="rounded-full" data-ai-hint={story.dataAiHint}/>
                <span className="text-white text-sm font-bold">{story.title}</span>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </Button>
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                        <X size={24} />
                    </Button>
                </Link>
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
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white text-center flex flex-col items-center">
            {page.content?.title && <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">{page.content.title}</h2>}
            {page.content?.body && <p className="text-base drop-shadow-md">{page.content.body}</p>}
        </div>

        {/* Chevron Navigation Buttons */}
        <Button
            variant="ghost"
            size="icon"
            onClick={prevPage}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-40 text-white bg-black/30 hover:bg-black/50"
            disabled={currentPage === 0}
        >
            <ChevronLeft />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={nextPage}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-40 text-white bg-black/30 hover:bg-black/50"
            disabled={currentPage === story.pages.length - 1}
        >
            <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
