
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Subscription, Plan, Credits } from '@/types';

// These would come from a real backend in a full implementation.
const PLAN_CREDITS: Record<Plan, Credits> = {
  free: { google: 0, pollinations: 10 },
  pro: { google: 500, pollinations: 500 },
  mega: { google: 1500, pollinations: 1500 },
};

// SIMULATED DATABASE of purchased emails.
// In a real app, this check would be done on a secure backend server.
const MOCK_PURCHASED_EMAILS: Record<string, Plan> = {
  'pro@example.com': 'pro',
  'mega@example.com': 'mega',
};

// Define credit cost per generation for each plan
const PLAN_CREDIT_COST: Record<Plan, { google: number; pollinations: number; }> = {
  free: { google: 0, pollinations: 2 }, // Pollinations costs 2 credits for free users
  pro: { google: 20, pollinations: 1 },
  mega: { google: 15, pollinations: 1 },
};

interface SubscriptionContextType {
  subscription: Subscription | null;
  activateSubscription: (email: string) => boolean; // Returns true on success
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
      const storedSub = localStorage.getItem('imagenBrainAiSubscription');
      if (storedSub) {
        const parsedSub = JSON.parse(storedSub) as Subscription;
        // Re-validate any stored paid plan to prevent tampering with local storage
        if (parsedSub.plan !== 'free') {
          const isValidPurchase = MOCK_PURCHASED_EMAILS[parsedSub.email.toLowerCase()] === parsedSub.plan;
          if (isValidPurchase) {
             // Ensure credits structure is up-to-date in case it changed
            if (!parsedSub.credits || typeof parsedSub.credits.google === 'undefined') {
                parsedSub.credits = PLAN_CREDITS[parsedSub.plan];
            }
            setSubscription(parsedSub);
          } else {
            // The stored plan is invalid, revert to free plan
            saveSubscription(createFreePlan());
          }
        } else {
           if (!parsedSub.credits || typeof parsedSub.credits.google === 'undefined' || parsedSub.credits.google > 0) {
              parsedSub.credits = PLAN_CREDITS.free; // Always ensure free plan has correct credits
           }
          setSubscription(parsedSub);
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
  }, [saveSubscription]);

  const activateSubscription = useCallback((email: string): boolean => {
    const purchasedPlan = MOCK_PURCHASED_EMAILS[email.toLowerCase()];

    if (purchasedPlan) {
        const newSubscription: Subscription = {
          email,
          plan: purchasedPlan,
          status: 'active',
          credits: PLAN_CREDITS[purchasedPlan],
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
    
    if (model === 'google') {
      if (subscription.plan === 'free') return false; // Free users cannot use Google model
      const cost = PLAN_CREDIT_COST[subscription.plan].google;
      if (subscription.credits.google >= cost) {
          const newSub = { ...subscription, credits: { ...subscription.credits, google: subscription.credits.google - cost } };
          saveSubscription(newSub);
          return true;
      }
    } else if (model === 'pollinations') {
       const cost = PLAN_CREDIT_COST[subscription.plan].pollinations;
       if (subscription.credits.pollinations >= cost) {
          const newSub = { ...subscription, credits: { ...subscription.credits, pollinations: subscription.credits.pollinations - cost } };
          saveSubscription(newSub);
          return true;
       }
    }

    return false;
  }, [subscription, isLoading, saveSubscription]);

  const canGenerate = useCallback((model: 'google' | 'pollinations') => {
    if (isLoading || !subscription) return false;

    if (model === 'google') {
        if (subscription.plan === 'free') return false; // Free users cannot use Google model at all
        const cost = PLAN_CREDIT_COST[subscription.plan].google;
        return subscription.credits.google >= cost;
    } else if (model === 'pollinations') {
        const cost = PLAN_CREDIT_COST[subscription.plan].pollinations;
        return subscription.credits.pollinations >= cost;
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
