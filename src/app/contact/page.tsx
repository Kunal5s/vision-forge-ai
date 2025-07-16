
import type { Metadata } from 'next';
import { Mail, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Contact Us | Imagen BrainAi',
  description: 'Get in touch with the Imagen BrainAi team. We are here to help with your inquiries, feedback, and support requests.',
};

export default function ContactPage() {
  return (
    <main className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Contact <span className="text-primary">Us</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Have questions, feedback, or need support? We'd love to hear from you. Reach out through the form below or via email.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Send Us a Message</CardTitle>
            <CardDescription>Fill out the form and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input type="text" id="name" name="name" placeholder="John Doe" required className="mt-1 bg-input border-input focus:border-primary focus:ring-primary" />
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input type="email" id="email" name="email" placeholder="you@example.com" required className="mt-1 bg-input border-input focus:border-primary focus:ring-primary" />
              </div>
              <div>
                <Label htmlFor="message" className="text-foreground">Message</Label>
                <Textarea id="message" name="message" rows={5} placeholder="Your question or feedback..." required className="mt-1 bg-input border-input focus:border-primary focus:ring-primary resize-none" />
              </div>
              <div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <MessageSquare size={18} className="mr-2" /> Send Message
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    Note: This form is currently a placeholder. For urgent matters, please use the email provided.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Mail className="text-primary" /> General Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-1">For general questions, partnership opportunities, or media inquiries, please email us at:</p>
              <a href="mailto:info@imagenbrain.ai" className="text-primary hover:underline font-medium">info@imagenbrain.ai</a>
              <p className="text-sm text-muted-foreground mt-2">We typically respond within 1-2 business days.</p>
            </CardContent>
          </Card>
          
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><HelpCircle className="text-primary" /> Support & Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-1">Encountering an issue or have a suggestion to make Imagen BrainAi better? Contact our support team:</p>
              <a href="mailto:support@imagenbrain.ai" className="text-primary hover:underline font-medium">support@imagenbrain.ai</a>
              <p className="text-sm text-muted-foreground mt-2">Your feedback is invaluable to us!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
