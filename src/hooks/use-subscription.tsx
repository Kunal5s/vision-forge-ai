
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Subscription, Plan } from '@/types';

// These would come from a real backend in a full implementation.
const PLAN_CREDITS: Record<Plan, number> = {
  free: 10,
  pro: 1000,
  mega: 3000,
};

// SIMULATED DATABASE of purchased emails.
// In a real app, this check would be done on a secure backend server.
const MOCK_PURCHASED_EMAILS: Record<string, Plan> = {
  'pro@example.com': 'pro',
  'mega@example.com': 'mega',
};

interface SubscriptionContextType {
  subscription: Subscription | null;
  activateSubscription: (email: string) => boolean; // Returns true on success
  deactivateSubscription: () => void;
  useCredit: () => boolean;
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
    if (sub) {
        setSubscription(sub);
        localStorage.setItem('imagenBrainAiSubscription', JSON.stringify(sub));
    } else {
        const freePlan = createFreePlan();
        setSubscription(freePlan);
        localStorage.setItem('imagenBrainAiSubscription', JSON.stringify(freePlan));
    }
  }, []);

  useEffect(() => {
    try {
      const storedSub = localStorage.getItem('imagenBrainAiSubscription');
      if (storedSub) {
        const parsedSub = JSON.parse(storedSub) as Subscription;
        // Re-validate any stored paid plan to prevent tampering with local storage
        if (parsedSub.plan !== 'free') {
          const isValidPurchase = MOCK_PURCHASED_EMAILS[parsedSub.email.toLowerCase()] === parsedSub.plan;
          if (isValidPurchase) {
            setSubscription(parsedSub);
          } else {
            // The stored plan is invalid, revert to free plan
            saveSubscription(createFreePlan());
          }
        } else {
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

  const useCredit = useCallback(() => {
    if (isLoading || !subscription) return false;
    
    // For paid plans, they must have credits to proceed.
    // For free plan, it's the same logic, but this also covers paid users running out.
    if (subscription.credits > 0) {
        const newSub = { ...subscription, credits: subscription.credits - 1 };
        saveSubscription(newSub);
        return true;
    }

    // If credits are 0 or less, deny usage.
    return false;
  }, [subscription, isLoading, saveSubscription]);

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
