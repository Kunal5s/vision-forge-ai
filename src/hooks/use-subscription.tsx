
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

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSub = localStorage.getItem('visionForgeSubscription');
      if (storedSub) {
        const parsedSub = JSON.parse(storedSub) as Subscription;
        // Simple validation
        if (parsedSub.email && parsedSub.plan) {
            // For mega plan, credits are infinite
            if(parsedSub.plan === 'mega') parsedSub.credits = Infinity;
            setSubscription(parsedSub);
        }
      }
    } catch (error) {
      console.error("Failed to load subscription from localStorage", error);
      localStorage.removeItem('visionForgeSubscription');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSubscription = (sub: Subscription | null) => {
    setSubscription(sub);
    if (sub) {
      localStorage.setItem('visionForgeSubscription', JSON.stringify(sub));
    } else {
      localStorage.removeItem('visionForgeSubscription');
    }
  };

  const activateSubscription = useCallback((email: string) => {
    // In a real app, this would verify purchase against a backend.
    // For this prototype, we'll assign a plan based on the email.
    let plan: Plan = 'pro'; // Default to pro
    if (email.endsWith('@mega.com')) { // Simple rule for demo
      plan = 'mega';
    } else if (email.endsWith('@example.com')) { // a free user for demo
        plan = 'free'
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
    saveSubscription(null);
  }, []);

  const useCredit = useCallback(() => {
    if (isLoading) return false;

    // If no subscription, treat as free user with 0 credits left.
    if(!subscription) return false;

    // Mega plan has infinite credits
    if(subscription.plan === 'mega') return true;

    if(subscription.credits > 0) {
        const newSub = {...subscription, credits: subscription.credits - 1};
        saveSubscription(newSub);
        return true;
    }

    // Out of credits
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
