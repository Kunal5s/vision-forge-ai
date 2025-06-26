
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
import { useSubscription } from '@/hooks/use-subscription';
import { UserCheck, UserX, ArrowUpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function SubscriptionManager() {
  const { subscription, activateSubscription, deactivateSubscription, isLoading } = useSubscription();
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleActivate = () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    const success = activateSubscription(email);

    if (success) {
      toast({
        title: 'Plan Activated!',
        description: `Your new plan has been activated for ${email}.`,
      });
      setIsOpen(false);
    } else {
       toast({
        title: 'Activation Failed',
        description: 'Email not found in purchase records. Please ensure you used the correct email or visit our pricing page to purchase a plan.',
        variant: 'destructive',
        duration: 7000,
      });
    }
  };
  
  const handleDeactivate = () => {
    deactivateSubscription();
    toast({
      title: 'Plan Deactivated',
      description: 'Your subscription has been deactivated. You are now on the Free plan.',
    });
    setIsOpen(false);
  }

  if (isLoading) {
    return <Button variant="outline" className="futuristic-glow-button" disabled>Loading...</Button>;
  }

  const isFreePlan = !subscription || subscription.plan === 'free';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="futuristic-glow-button">
          {isFreePlan ? <ArrowUpCircle className="mr-2 h-4 w-4 text-accent" /> : <UserCheck className="mr-2 h-4 w-4 text-primary" />}
          {isFreePlan ? 'Activate Plan' : 'Manage Plan'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glassmorphism-panel">
        <DialogHeader>
          <DialogTitle>{isFreePlan ? 'Activate Your Purchased Plan' : 'Manage Your Subscription'}</DialogTitle>
          <DialogDescription>
            {subscription && !isFreePlan
              ? `Your ${subscription.plan.toUpperCase()} plan is active for ${subscription.email}.`
              : "To access the premium VisionForge AI model and get more credits, please purchase a plan and activate it with your email."}
          </DialogDescription>
        </DialogHeader>
        
        {isFreePlan && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="col-span-3"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground px-4">
              For this prototype, use 'pro@example.com' for Pro or 'mega@example.com' for the Mega plan to test activation.
            </p>
             <p className="text-xs text-center text-muted-foreground px-4 mt-2">
              Ready to upgrade?{' '}
              <Link href="/pricing" className="text-primary underline hover:text-primary/80" onClick={() => setIsOpen(false)}>
                View Plans
              </Link>
            </p>
          </div>
        )}

        <DialogFooter>
          {subscription && !isFreePlan ? (
            <Button onClick={handleDeactivate} variant="destructive">
              <UserX className="mr-2 h-4 w-4" /> Deactivate Plan
            </Button>
          ) : (
            <Button onClick={handleActivate} type="submit" className='bg-primary text-primary-foreground hover:bg-primary/90'>Activate</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
