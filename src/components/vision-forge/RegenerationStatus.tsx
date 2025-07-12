'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { regenerateFeaturedArticles } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Sparkles, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

type Status = 'idle' | 'pending' | 'success' | 'error';

export function RegenerationStatus() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Regenerate Featured Articles');

  const handleClick = async () => {
    setStatus('pending');
    setMessage('Regenerating...');
    try {
      const result = await regenerateFeaturedArticles();
      if (result.success) {
        setStatus('success');
        setMessage('Success!');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Regeneration failed:', error);
      setStatus('error');
      setMessage('Error. Try again.');
    } finally {
      // Reset after a few seconds to allow another attempt
      setTimeout(() => {
        setStatus('idle');
        setMessage('Regenerate Featured Articles');
      }, 5000);
    }
  };

  const statusStyles = {
    idle: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    pending: 'bg-destructive text-destructive-foreground cursor-wait',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    error: 'bg-yellow-500 hover:bg-yellow-600 text-black',
  };

  const Icon = {
    idle: <Sparkles className="h-4 w-4" />,
    pending: <Loader className="h-4 w-4 animate-spin" />,
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertTriangle className="h-4 w-4" />,
  }[status];

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={handleClick}
        disabled={status === 'pending' || status === 'success'}
        className={cn('transition-all duration-300 w-64', statusStyles[status])}
      >
        <div className="w-5 mr-2">{Icon}</div>
        <span>{message}</span>
      </Button>
    </div>
  );
}
