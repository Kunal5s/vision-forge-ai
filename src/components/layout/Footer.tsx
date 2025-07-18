"use client";

import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="bg-background text-card-foreground py-10 mt-auto border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <BrainCircuit className="h-7 w-7 text-foreground" />
              <span className="text-xl font-bold text-foreground">
                Imagen BrainAi
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering your creativity with cutting-edge AI image generation and editing tools. Bring your visions to life.
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-bold text-foreground mb-4">Our Services</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/' && 'text-foreground font-semibold')}>AI Image Generation</Link></li>
              <li><Link href="/edit" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/edit' && 'text-foreground font-semibold')}>Image Editor</Link></li>
              <li><Link href="/pricing" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/pricing' && 'text-foreground font-semibold')}>Pricing</Link></li>
              <li><Link href="/blog" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/blog' && 'text-foreground font-semibold')}>Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-bold text-foreground mb-4">Legal & Company</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/about' && 'text-foreground font-semibold')}>About Us</Link></li>
              <li><Link href="/contact" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/contact' && 'text-foreground font-semibold')}>Contact Us</Link></li>
               <li><Link href="/models" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/models' && 'text-foreground font-semibold')}>Our Models</Link></li>
              <li><Link href="/privacy" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/privacy' && 'text-foreground font-semibold')}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/terms' && 'text-foreground font-semibold')}>Terms of Service</Link></li>
              <li><Link href="/disclaimer" className={cn("block rounded-md -ml-2 px-2 py-1 text-foreground/80 hover:text-foreground", pathname === '/disclaimer' && 'text-foreground font-semibold')}>Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground border-t pt-8">
          <p>&copy; {new Date().getFullYear()} Imagen BrainAi. All Rights Reserved.</p>
          <p className="mt-1">Crafted with <span role="img" aria-label="heart">❤️</span> and powered by Google AI & Firebase.</p>
        </div>
      </div>
    </footer>
  );
}
