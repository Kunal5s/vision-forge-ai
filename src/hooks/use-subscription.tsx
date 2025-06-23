
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Subscription, Plan } from '@/types';

// These would come from a real backend in a full implementation.
const PLAN_CREDITS: Record<Plan, number | typeof Infinity> = {
  free: 10,
  pro: 1000,
  mega: Infinity,
};

interface SubscriptionContextType {
  subscription: Subscription | null;
  activateSubscription: (email: string) => void;
  deactivateSubscription: () => void;
  useCredit: () => boolean; // Returns true if a credit was successfully used, false otherwise
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const createFreePlan = (): Subscription => ({
  email: 'guest',
  plan: 'free',
  status: 'active',
  credits: PLAN_CREDITS.free as number,
});


export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSub = localStorage.getItem('visionForgeSubscription');
      if (storedSub) {
        const parsedSub = JSON.parse(storedSub) as Subscription;
        if (parsedSub.email && parsedSub.plan) {
            if(parsedSub.plan === 'mega') parsedSub.credits = Infinity;
            setSubscription(parsedSub);
        } else {
            setSubscription(createFreePlan());
        }
      } else {
        saveSubscription(createFreePlan());
      }
    } catch (error) {
      console.error("Failed to load subscription from localStorage", error);
      saveSubscription(createFreePlan());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSubscription = (sub: Subscription | null) => {
    if (sub) {
        setSubscription(sub);
        localStorage.setItem('visionForgeSubscription', JSON.stringify(sub));
    } else {
        const freePlan = createFreePlan();
        setSubscription(freePlan);
        localStorage.setItem('visionForgeSubscription', JSON.stringify(freePlan));
    }
  };

  const activateSubscription = useCallback((email: string) => {
    let plan: Plan = 'pro';
    if (email.endsWith('@mega.com')) {
      plan = 'mega';
    }

    const newSubscription: Subscription = {
      email,
      plan,
      status: 'active',
      credits: PLAN_CREDITS[plan],
    };
    saveSubscription(newSubscription);
  }, []);

  const deactivateSubscription = useCallback(() => {
    saveSubscription(createFreePlan());
  }, []);

  const useCredit = useCallback(() => {
    if (isLoading || !subscription) return false;

    if (subscription.plan === 'mega') return true;

    if (subscription.credits > 0) {
        const newSub = { ...subscription, credits: subscription.credits - 1 };
        saveSubscription(newSub);
        return true;
    }

    return false;
  }, [subscription, isLoading]);

  return (
    <SubscriptionContext.Provider value={{ subscription, activateSubscription, deactivateSubscription, useCredit, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
