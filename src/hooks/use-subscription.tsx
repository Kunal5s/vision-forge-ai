
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Subscription, Plan, Credits } from '@/types';

const PLAN_CREDITS: Record<Plan, Credits> = {
  free: { google: 0, pollinations: 20 }, // 20 daily credits for the free plan
  pro: { google: 500, pollinations: Infinity }, // Paid plans get unlimited standard generations
  mega: { google: 1500, pollinations: Infinity },
};

// SIMULATED DATABASE of purchased emails.
const MOCK_PURCHASED_EMAILS: Record<string, Plan> = {
  'pro@example.com': 'pro',
  'mega@example.com': 'mega',
};

// Define credit cost per generation
const PLAN_CREDIT_COST: Record<Plan, { google: number; pollinations: number; }> = {
  free: { google: 0, pollinations: 2 }, // Free plan costs 2 credits per generation
  pro: { google: 20, pollinations: 0 }, // Paid plans have no cost for standard model
  mega: { google: 15, pollinations: 0 },
};

interface SubscriptionContextType {
  subscription: Subscription | null;
  activateSubscription: (email: string) => boolean;
  deactivateSubscription: () => void;
  useCredit: (model: 'google' | 'pollinations') => boolean;
  canGenerate: (model: 'google' | 'pollinations') => boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const createFreePlan = (): Subscription => ({
  email: 'guest',
  plan: 'free',
  status: 'active',
  credits: PLAN_CREDITS.free,
  lastReset: new Date().toISOString(),
});

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSubscription = useCallback((sub: Subscription | null) => {
    const subToSave = sub || createFreePlan();
    setSubscription(subToSave);
    try {
        localStorage.setItem('imagenBrainAiSubscription', JSON.stringify(subToSave));
    } catch (e) {
        console.error("Failed to save subscription to localStorage:", e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    try {
      let storedSub = localStorage.getItem('imagenBrainAiSubscription');
      let parsedSub: Subscription | null = storedSub ? JSON.parse(storedSub) : null;

      if (parsedSub) {
        // Handle daily reset for free users
        if (parsedSub.plan === 'free') {
          const lastResetDate = new Date(parsedSub.lastReset || 0);
          const now = new Date();
          const oneDay = 24 * 60 * 60 * 1000;
          if (now.getTime() - lastResetDate.getTime() > oneDay) {
            parsedSub.credits = PLAN_CREDITS.free;
            parsedSub.lastReset = now.toISOString();
          }
        }
        // Validate paid plans against mock DB
        else if (MOCK_PURCHASED_EMAILS[parsedSub.email.toLowerCase()] !== parsedSub.plan) {
            parsedSub = createFreePlan(); // Downgrade if invalid
        }
        
        // Ensure credit structure is always correct
        if (!parsedSub.credits || typeof parsedSub.credits.google === 'undefined') {
            parsedSub.credits = PLAN_CREDITS[parsedSub.plan];
        }

        saveSubscription(parsedSub);

      } else {
        saveSubscription(createFreePlan());
      }
    } catch (error) {
      console.error("Failed to load subscription from localStorage", error);
      saveSubscription(createFreePlan());
    } finally {
      setIsLoading(false);
    }
  }, [saveSubscription]);

  const activateSubscription = useCallback((email: string): boolean => {
    const purchasedPlan = MOCK_PURCHASED_EMAILS[email.toLowerCase()];
    if (purchasedPlan) {
        const newSubscription: Subscription = {
          email,
          plan: purchasedPlan,
          status: 'active',
          credits: PLAN_CREDITS[purchasedPlan],
          lastReset: new Date().toISOString(),
        };
        saveSubscription(newSubscription);
        return true;
    }
    return false;
  }, [saveSubscription]);

  const deactivateSubscription = useCallback(() => {
    saveSubscription(createFreePlan());
  }, [saveSubscription]);

  const useCredit = useCallback((model: 'google' | 'pollinations') => {
    if (isLoading || !subscription) return false;
    
    const cost = PLAN_CREDIT_COST[subscription.plan][model];
    if (cost === 0) return true; // No cost for this model/plan

    if (model === 'pollinations' && subscription.plan === 'free') {
      if (subscription.credits.pollinations >= cost) {
        const newSub = { ...subscription, credits: { ...subscription.credits, pollinations: subscription.credits.pollinations - cost }};
        saveSubscription(newSub);
        return true;
      }
    }
    
    if (model === 'google' && subscription.plan !== 'free') {
      if (subscription.credits.google >= cost) {
          const newSub = { ...subscription, credits: { ...subscription.credits, google: subscription.credits.google - cost } };
          saveSubscription(newSub);
          return true;
      }
    }

    return false;
  }, [subscription, isLoading, saveSubscription]);

  const canGenerate = useCallback((model: 'google' | 'pollinations') => {
    if (isLoading || !subscription) return false;

    if (model === 'google') {
      if (subscription.plan === 'free') return false;
      return subscription.credits.google >= PLAN_CREDIT_COST[subscription.plan].google;
    }

    if (model === 'pollinations') {
      if (subscription.plan !== 'free') return true; // Paid plans have unlimited
      return subscription.credits.pollinations >= PLAN_CREDIT_COST[subscription.plan].pollinations;
    }
    
    return false;
  }, [subscription, isLoading]);

  return (
    <SubscriptionContext.Provider value={{ subscription, activateSubscription, deactivateSubscription, useCredit, canGenerate, isLoading }}>
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
