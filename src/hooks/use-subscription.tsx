
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { type Subscription, type Plan, type Credits, SubscriptionSchema } from '@/lib/types';
import { useToast } from './use-toast';

const PLAN_CREDITS: Record<Plan, Credits> = {
  free: { google: 0 },
  pro: { google: 5000 },
  mega: { google: 15000 },
};

// SIMULATED DATABASE of purchased emails.
const MOCK_PURCHASED_EMAILS: Record<string, Plan> = {
  'pro@gmail.com': 'pro',
  'mega@yahoo.com': 'mega',
};

// Define credit cost per generation.
const PLAN_CREDIT_COST: Record<Plan, { google: number }> = {
  free: { google: 0 }, 
  pro: { google: 100 },
  mega: { google: 100 },
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
      const storedSub = localStorage.getItem('imagenBrainAiSubscription');
      if (storedSub) {
        const parsedJson = JSON.parse(storedSub);
        const validation = SubscriptionSchema.safeParse(parsedJson);

        if (validation.success) {
          const parsedSub = validation.data;
          const purchaseDate = new Date(parsedSub.purchaseDate);
          const expiryDate = new Date(purchaseDate);
          expiryDate.setDate(purchaseDate.getDate() + PLAN_VALIDITY_DAYS);

          // Check for expiration
          if (new Date() > expiryDate && parsedSub.plan !== 'free') {
            console.log("Subscription expired, resetting to free plan.");
            localStorage.removeItem('imagenBrainAiSubscription');
            setSubscription(createFreePlan());
          } else {
            // Plan is valid
            setSubscription(parsedSub);
          }
        } else {
          // Validation failed, clear storage and use free plan
          console.warn("Invalid subscription data in localStorage, resetting.", validation.error);
          localStorage.removeItem('imagenBrainAiSubscription');
          setSubscription(createFreePlan());
        }
      } else {
        // No subscription found, use free plan
        setSubscription(createFreePlan());
      }
    } catch (e) {
      console.error("Failed to load or parse subscription from localStorage, resetting.", e);
      // On any error, clear storage and use free plan
      try {
        localStorage.removeItem('imagenBrainAiSubscription');
      } catch (removeError) {
        console.error("Failed to remove item from localStorage", removeError);
      }
      setSubscription(createFreePlan());
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array ensures this runs only ONCE on client mount.

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
    
    // Free models do not consume credits
    if (!isPremium) {
      return true;
    }
    
    // Premium models on a free plan cannot be used
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

    // Free models can be used by anyone
    if (!isPremium) {
      return true;
    }

    // Premium models can only be used on paid plans with enough credits
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
