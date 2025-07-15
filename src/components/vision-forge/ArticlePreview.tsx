
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import parse from 'html-react-parser';
import { X } from 'lucide-react';
import { JSDOM } from 'jsdom'; // Use on client with caution or find alternative

interface ArticlePreviewProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  content: string;
  category: string;
  image: string;
}

const renderContentForPreview = (html: string) => {
    // This function will parse the HTML and prepare it for rendering.
    // We can use this to handle any special cases if needed. For now, it's direct parsing.
    return parse(html, {
        replace: domNode => {
            if (domNode.type === 'tag' && domNode.name === 'img') {
                const { src, alt } = domNode.attribs;
                return (
                    <div className="my-8">
                        <Image
                            src={src}
                            alt={alt || 'Article image'}
                            width={800}
                            height={450}
                            className="rounded-lg shadow-lg mx-auto"
                        />
                    </div>
                );
            }
        }
    });
};


export function ArticlePreview({
  isOpen,
  onOpenChange,
  title,
  content,
  category,
  image,
}: ArticlePreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Article Preview</DialogTitle>
          <DialogDescription>
            This is how your article will appear to visitors.
          </DialogDescription>
          <DialogClose asChild>
             <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <main className="container mx-auto py-12 px-4">
            <div className="max-w-3xl mx-auto">
              <header className="mb-8">
                <Badge variant="secondary" className="mb-4">
                  {category}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  {parse(title)}
                </h1>
                {image && (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden mt-6 shadow-lg">
                    <Image
                      src={image}
                      alt={title.replace(/<[^>]*>?/gm, '')}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint="article feature image"
                      priority
                    />
                  </div>
                )}
              </header>

              <article className="prose dark:prose-invert max-w-none">
                {renderContentForPreview(content)}
              </article>
            </div>
          </main>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
