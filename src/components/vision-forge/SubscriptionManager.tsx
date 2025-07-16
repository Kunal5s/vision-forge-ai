
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/use-subscription';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SubscriptionManager() {
  const { subscription, activateSubscription, deactivateSubscription, isLoading } = useSubscription();
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activateSubscription(email)) {
      toast({
        title: 'Plan Activated!',
        description: 'Your premium plan and credits are now active.',
      });
      setIsOpen(false);
    } else {
      toast({
        title: 'Activation Failed',
        description: 'The email provided does not match a purchased plan. Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivate = () => {
    deactivateSubscription();
    toast({
      title: 'Plan Deactivated',
      description: 'You have been switched to the Free plan.',
    });
    setIsOpen(false);
  }

  const isLoggedIn = subscription && subscription.plan !== 'free';

  if (isLoading) {
    return <Button variant="outline" className="text-xs h-8 md:h-9" disabled>Loading Plan...</Button>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="text-xs h-9 w-full md:w-auto bg-foreground text-background hover:bg-foreground/90">
            <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
            {isLoggedIn ? 'Manage Plan' : 'Activate Plan'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {isLoggedIn ? (
          <>
            <DialogHeader>
              <DialogTitle>Manage Your Plan</DialogTitle>
              <DialogDescription>
                You are currently on the <span className="font-semibold capitalize text-foreground">{subscription?.plan}</span> plan.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <p className="text-sm">Email: <span className="font-semibold">{subscription?.email}</span></p>
                <p className="text-sm">Credits: <span className="font-semibold">{subscription?.credits?.google.toLocaleString()}</span></p>
            </div>
            <DialogFooter>
              <Button onClick={handleDeactivate} variant="destructive">Switch to Free Plan</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Activate Your Premium Plan</DialogTitle>
              <DialogDescription>
                Enter the email address you used to purchase your Pro or Mega plan to activate your credits.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleActivate} className="space-y-4 py-4">
              <div>
                <Label htmlFor="email-activate" className="text-right">
                  Email
                </Label>
                <Input
                  id="email-activate"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit">Activate</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
