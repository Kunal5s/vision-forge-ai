
'use client';

import { useState, useEffect } from 'react';
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
import { UserCheck, UserX, ArrowUpCircle, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function SubscriptionManager() {
  const { subscription, activateSubscription, deactivateSubscription, isLoading } = useSubscription();
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const handleActivate = () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    const allowedDomains = ['gmail.com', 'yahoo.com'];
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain.toLowerCase())) {
      toast({
        title: 'Invalid Email Provider',
        description: 'For activation, please use a Gmail or Yahoo email address to prevent spam.',
        variant: 'destructive',
        duration: 7000,
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

  const isFreePlan = !subscription || subscription.plan === 'free';

  useEffect(() => {
    if (isLoading || isFreePlan || !subscription || !subscription.purchaseDate) {
      setDaysRemaining(null);
      return;
    }

    const purchaseDate = new Date(subscription.purchaseDate);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(purchaseDate.getDate() + 30);
    const now = new Date();
    const remaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    setDaysRemaining(remaining);
  }, [subscription, isLoading, isFreePlan]);


  if (isLoading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {isFreePlan ? <ArrowUpCircle className="mr-2 h-4 w-4 text-accent" /> : <UserCheck className="mr-2 h-4 w-4 text-primary" />}
          {isFreePlan ? 'Activate Plan' : 'Manage Plan'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isFreePlan ? 'Activate Your Purchased Plan' : 'Manage Your Subscription'}</DialogTitle>
          <DialogDescription>
            {subscription && !isFreePlan
              ? "View your current plan details or deactivate your subscription."
              : "To access premium features, please purchase a plan and activate it with your Gmail or Yahoo email."}
          </DialogDescription>
        </DialogHeader>
        
        {isFreePlan ? (
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
                placeholder="you@gmail.com"
                className="col-span-3"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground px-4">
              For this prototype, use 'pro@gmail.com' or 'mega@yahoo.com' to test activation.
            </p>
             <p className="text-xs text-center text-muted-foreground px-4 mt-2">
              Ready to upgrade?{' '}
              <Link href="/pricing" className="text-primary underline hover:text-primary/80" onClick={() => setIsOpen(false)}>
                View Plans
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold text-foreground">{subscription?.email}</span>
            </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Plan:</span>
                <Badge variant={subscription?.plan === 'mega' ? 'default' : 'secondary'} className="capitalize">{subscription?.plan}</Badge>
            </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Validity:</span>
                 <div className="flex items-center gap-1 font-semibold text-foreground">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {daysRemaining !== null ? `${daysRemaining} days remaining` : '...'}
                 </div>
            </div>
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
