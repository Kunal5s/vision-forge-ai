"use client";

import Link from 'next/link';
import { BrainCircuit, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="bg-background text-card-foreground py-10 mt-auto border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <BrainCircuit className="h-7 w-7 text-foreground" />
              <span className="text-xl font-bold text-foreground">
                Imagen BrainAi
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Empowering your creativity with cutting-edge AI image generation and editing tools. Bring your visions to life.
            </p>
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
          
          <div>
             <h3 className="text-md font-bold text-foreground mb-4">Follow Us</h3>
             <div className="flex items-center gap-4">
                <a href="https://x.com/kunal_sonpitre" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <Twitter className="h-6 w-6" />
                </a>
                <a href="https://facebook.com/kunal.sonpitre" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <Facebook className="h-6 w-6" />
                </a>
                <a href="https://instagram.com/kunal_sonpitre" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <Instagram className="h-6 w-6" />
                </a>
                <a href="https://linkedin.com/in/kunal-sonpitre" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <Linkedin className="h-6 w-6" />
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
