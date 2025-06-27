
import Link from 'next/link';
import { Sparkles, Twitter, Instagram, Facebook, Linkedin, Github } from 'lucide-react';

export function Footer() {
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
            <h3 className="text-md font-semibold text-foreground mb-4">Our Services</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">AI Image Generation</Link></li>
              <li><Link href="/pricing" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">Pricing</Link></li>
              <li><Link href="/#features" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">Prompt Enhancement</Link></li>
              <li><Link href="/#features" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">Style Customization</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">About Us</Link></li>
              <li><Link href="/contact" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">Contact Us</Link></li>
              <li><Link href="/privacy" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">Privacy Policy</Link></li>
              <li><Link href="/terms" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="block text-muted-foreground rounded-md -ml-2 px-2 py-1 transition-colors hover:bg-muted">Disclaimer</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-semibold text-foreground mb-4">Follow Us</h3>
            <div className="flex items-center gap-4">
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-6 w-6" />
              </Link>
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
