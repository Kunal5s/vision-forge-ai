
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Subscription, Plan, Credits } from '@/types';
import { useToast } from './use-toast';

const PLAN_CREDITS: Record<Plan, Credits> = {
  free: { google: 0 },
  pro: { google: 5000 },
  mega: { google: 15000 },
};

// SIMULATED DATABASE of purchased emails.
const MOCK_PURCHASED_EMAILS: Record<string, Plan> = {
  'pro@example.com': 'pro',
  'mega@example.com': 'mega',
};

// Define credit cost per generation.
const PLAN_CREDIT_COST: Record<Plan, { google: number }> = {
  free: { google: 0 }, 
  pro: { google: 100 },
  mega: { google: 200 },
};

const PLAN_VALIDITY_DAYS = 30;

interface SubscriptionContextType {
  subscription: Subscription | null;
  activateSubscription: (email: string) => boolean;
  deactivateSubscription: () => void;
  useCredit: (isPremium: boolean) => boolean;
  canGenerate: (isPremium: boolean) => boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const createFreePlan = (): Subscription => ({
  email: 'guest',
  plan: 'free',
  status: 'active',
  credits: PLAN_CREDITS.free,
  purchaseDate: new Date().toISOString(),
  lastReset: new Date().toISOString(),
});

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        // Handle plan expiry for paid plans
        if (parsedSub && (parsedSub.plan === 'pro' || parsedSub.plan === 'mega')) {
            const purchaseDate = new Date(parsedSub.purchaseDate);
            const expiryDate = new Date(purchaseDate);
            expiryDate.setDate(purchaseDate.getDate() + PLAN_VALIDITY_DAYS);

            if (new Date() > expiryDate) {
                toast({
                    title: "Plan Expired",
                    description: `Your ${parsedSub.plan} plan has expired. You are now on the Free plan.`,
                    variant: 'destructive',
                });
                parsedSub = createFreePlan();
            }
        }
        
        // Validate paid plans against mock DB just in case
        if (parsedSub && parsedSub.plan !== 'free' && MOCK_PURCHASED_EMAILS[parsedSub.email.toLowerCase()] !== parsedSub.plan) {
            parsedSub = createFreePlan(); // Downgrade if invalid
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
  }, [saveSubscription, toast]);

  const activateSubscription = useCallback((email: string): boolean => {
    const purchasedPlan = MOCK_PURCHASED_EMAILS[email.toLowerCase()];
    if (purchasedPlan) {
        const now = new Date().toISOString();
        const newSubscription: Subscription = {
          email,
          plan: purchasedPlan,
          status: 'active',
          credits: PLAN_CREDITS[purchasedPlan],
          purchaseDate: now,
          lastReset: now,
        };
        saveSubscription(newSubscription);
        return true;
    }
    return false;
  }, [saveSubscription]);

  const deactivateSubscription = useCallback(() => {
    saveSubscription(createFreePlan());
  }, [saveSubscription]);

  const useCredit = useCallback((isPremium: boolean) => {
    if (isLoading || !subscription) return false;
    
    // Free plan cannot generate
    if (subscription.plan === 'free') {
      return false;
    }

    const cost = PLAN_CREDIT_COST[subscription.plan].google;
    const currentCredits = subscription.credits.google;

    if (currentCredits >= cost) {
        const newCredits = { ...subscription.credits, google: currentCredits - cost };
        const newSub = { ...subscription, credits: newCredits };
        saveSubscription(newSub);
        return true;
    }

    return false;
  }, [subscription, isLoading, saveSubscription]);

  const canGenerate = useCallback((isPremium: boolean) => {
    if (isLoading || !subscription) return false;

    // Free plan cannot use any models
    if (subscription.plan === 'free') return false;

    return subscription.credits.google >= PLAN_CREDIT_COST[subscription.plan].google;
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
