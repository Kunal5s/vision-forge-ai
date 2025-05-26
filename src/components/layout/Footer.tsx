
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card/80 backdrop-blur-md text-card-foreground py-10 mt-auto border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Sparkles className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-foreground">VisionForge AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering your creativity with cutting-edge AI image generation. Bring your most ambitious visions to life with ease and precision.
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-semibold text-foreground mb-4">Our Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">AI Image Generation</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Prompt Enhancement</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Style Customization</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Aspect Ratio Control</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-md font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              {/* <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li> */}
              {/* <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li> */}
            </ul>
          </div>

          <div>
            <h3 className="text-md font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground border-t border-border/30 pt-8">
          <p>&copy; {new Date().getFullYear()} VisionForge AI. All Rights Reserved.</p>
          <p className="mt-1">Crafted with <span role="img" aria-label="heart">❤️</span> and powered by Google AI & Firebase.</p>
        </div>
      </div>
    </footer>
  );
}
