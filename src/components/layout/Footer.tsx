"use client";

import Link from 'next/link';
import { Sparkles, Twitter, Instagram, Facebook, Linkedin, Github } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="bg-background text-card-foreground py-10 mt-auto border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Sparkles className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-foreground">Imagen BrainAi</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering your creativity with cutting-edge AI image generation and editing tools. Bring your visions to life.
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-bold text-foreground mb-4">Our Services</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className={cn("block rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary", pathname === '/' ? 'text-foreground font-semibold' : 'text-foreground/80')}>AI Image Generation</Link></li>
              <li><Link href="/pricing" className={cn("block rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary", pathname === '/pricing' ? 'text-foreground font-semibold' : 'text-foreground/80')}>Pricing</Link></li>
              <li><Link href="/#features" className="block text-foreground/80 rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary">Prompt Enhancement</Link></li>
              <li><Link href="/#features" className="block text-foreground/80 rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary">Style Customization</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-bold text-foreground mb-4">Legal</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about" className={cn("block rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary", pathname === '/about' ? 'text-foreground font-semibold' : 'text-foreground/80')}>About Us</Link></li>
              <li><Link href="/contact" className={cn("block rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary", pathname === '/contact' ? 'text-foreground font-semibold' : 'text-foreground/80')}>Contact Us</Link></li>
              <li><Link href="/privacy" className={cn("block rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary", pathname === '/privacy' ? 'text-foreground font-semibold' : 'text-foreground/80')}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={cn("block rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary", pathname === '/terms' ? 'text-foreground font-semibold' : 'text-foreground/80')}>Terms of Service</Link></li>
              <li><Link href="/disclaimer" className={cn("block rounded-md -ml-2 px-2 py-1 transition-colors hover:text-primary", pathname === '/disclaimer' ? 'text-foreground font-semibold' : 'text-foreground/80')}>Disclaimer</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-bold text-foreground mb-4">Follow Us</h3>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/ImagenBrainAi" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-foreground/80 hover:text-primary transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="https://instagram.com/ImagenBrainAi" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-foreground/80 hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://facebook.com/ImagenBrainAi" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-foreground/80 hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://linkedin.com/company/ImagenBrainAi" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-foreground/80 hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="https://github.com/ImagenBrainAi" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-foreground/80 hover:text-primary transition-colors">
                <Github className="h-6 w-6" />
              </a>
            </div>
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
