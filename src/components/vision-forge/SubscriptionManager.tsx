
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
import { KeyRound, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    activateSubscription(email);
    toast({
      title: 'Plan Activated!',
      description: `Your plan has been activated for ${email}.`,
    });
    setIsOpen(false);
  };
  
  const handleDeactivate = () => {
    deactivateSubscription();
    toast({
      title: 'Plan Deactivated',
      description: 'Your subscription has been deactivated.',
    });
    setIsOpen(false);
  }

  if (isLoading) {
    return <Button variant="outline" className="futuristic-glow-button" disabled>Loading...</Button>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="futuristic-glow-button">
          {subscription ? <UserCheck className="mr-2 h-4 w-4 text-primary" /> : <KeyRound className="mr-2 h-4 w-4" />}
          {subscription ? 'Plan Active' : 'Activate Plan'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glassmorphism-panel">
        <DialogHeader>
          <DialogTitle>{subscription ? 'Manage Your Subscription' : 'Activate Your Plan'}</DialogTitle>
          <DialogDescription>
            {subscription 
              ? `Your ${subscription.plan.toUpperCase()} plan is active for ${subscription.email}.`
              : "Enter the email you used to purchase a plan to activate it."}
          </DialogDescription>
        </DialogHeader>
        
        {!subscription && (
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
              This is a prototype. Use an email ending in '@mega.com' for the Mega plan or any other for Pro.
            </p>
          </div>
        )}

        <DialogFooter>
          {subscription ? (
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
