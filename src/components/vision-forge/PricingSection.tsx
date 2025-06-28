
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For exploring the app.',
    features: [
      'Explore the user interface',
      'View pricing and features',
      'Community support',
      'No image generation credits',
    ],
    buttonText: 'Start Exploring',
    buttonVariant: 'outline',
    href: '/',
    isFeatured: false,
  },
  {
    name: 'Pro',
    price: '$50',
    description: 'For professionals and creators.',
    features: [
      '5,000 Google Credits/month',
      'Fast generation speed',
      'Premium quality (up to 8K)',
      'Access to all AI models',
      'Generation history saved',
      'Commercial use license',
      'Priority support',
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'default',
    href: 'https://buy.polar.sh/polar_cl_zW8axhXjqFczXedDs6hRlhy9kytiSe6myTiCs08RuEL',
    isFeatured: true,
  },
  {
    name: 'Mega',
    price: '$100',
    description: 'For power users and teams.',
    features: [
      '15,000 Google Credits/month',
      'Lightning-fast speed',
      'Premium quality (up to 8K)',
      'Access to all AI models',
      'Generation history saved',
      'API access (coming soon)',
      'Dedicated support',
    ],
    buttonText: 'Upgrade to Mega',
    buttonVariant: 'outline',
    href: 'https://buy.polar.sh/polar_cl_BozstB6v0fuS4BjfjFkqBXDQMxT5qEBYKlQKR0sMiR8',
    isFeatured: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-3">
          Choose Your Perfect <span className="text-accent">Plan</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Simple, transparent pricing for Imagen BrainAi. No hidden fees.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              'flex flex-col h-full transition-shadow hover:shadow-lg animate-breathing-glow',
              plan.isFeatured && 'border-primary shadow-2xl scale-105'
            )}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">{plan.name}</CardTitle>
              <p className="text-4xl font-bold text-primary">{plan.price}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
              <CardDescription className="pt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className={cn('w-full')} variant={plan.buttonVariant as any}>
                <Link href={plan.href} target="_blank" rel="noopener noreferrer">{plan.buttonText}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
