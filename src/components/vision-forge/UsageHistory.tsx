
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GeneratedImageHistoryItem } from '@/types';
import { Download, Eye, Trash2, Image as ImageIcon } from 'lucide-react';
import { FuturisticPanel } from './FuturisticPanel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';


interface UsageHistoryProps {
  history: GeneratedImageHistoryItem[];
  onSelectHistoryItem: (item: GeneratedImageHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export function UsageHistory({ history, onSelectHistoryItem, onDeleteHistoryItem, onClearHistory }: UsageHistoryProps) {
  const { toast } = useToast();

  const handleDownloadHistoryImage = async (item: GeneratedImageHistoryItem) => {
    if (!item.imageUrl) return;

    const { id, update, dismiss } = toast({
      title: 'Preparing Download',
      description: 'Your image is being prepared...',
    });

    try {
        const response = await fetch(item.imageUrl);
        if (!response.ok) throw new Error('Network response was not ok.');
        
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const safePrompt = item.prompt.substring(0, 20).replace(/\s+/g, '_');
        const extension = blob.type.split('/')[1] || 'png';
        link.download = `imagenbrainai_${safePrompt}_${item.id.slice(-4)}.${extension}`;
        
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
            link.href = item.imageUrl;
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


  if (history.length === 0) {
    return (
      <FuturisticPanel className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-center text-foreground/80">Usage History</h2>
        <p className="text-center text-muted-foreground">No images generated yet. Start creating!</p>
      </FuturisticPanel>
    );
  }

  return (
    <FuturisticPanel className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground/80">Usage History</h2>
        {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 size={16} className="mr-2" /> Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all your generated image history. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearHistory} className="bg-destructive hover:bg-destructive/90">
                    Yes, clear history
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        )}
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border bg-background/30 hover:bg-accent/10 transition-colors duration-200">
              <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted/20 flex items-center justify-center">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.prompt.substring(0,30)} layout="fill" objectFit="contain" data-ai-hint="history thumbnail" />
                ) : (
                  <ImageIcon size={24} className="text-muted-foreground" /> 
                )}
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-medium truncate text-foreground" title={item.prompt}>{item.prompt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span>&middot;</span>
                    <span>{item.aspectRatio}</span>
                    <span>&middot;</span>
                    <span className={`px-1.5 py-0.5 rounded-full capitalize ${
                        item.plan === 'mega' ? 'bg-primary/20 text-primary font-semibold' :
                        item.plan === 'pro' ? 'bg-accent/20 text-accent font-semibold' :
                        'bg-muted'
                    }`}>
                        {item.plan}
                    </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onSelectHistoryItem(item)} title="View & Re-use Parameters" className="hover:text-primary">
                  <Eye size={18} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDownloadHistoryImage(item)} title="Download Image" className="hover:text-primary">
                  <Download size={18} />
                </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" title="Delete Item" className="hover:text-destructive">
                          <Trash2 size={18} />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the image and its details from your history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteHistoryItem(item.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </FuturisticPanel>
  );
}
