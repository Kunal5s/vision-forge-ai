
import type { Metadata } from 'next';
import { BlogSection } from '@/components/vision-forge/BlogSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | VisionForge AI',
  description: 'Explore the latest trends, tutorials, and news in AI image generation. Stay ahead with tips and insights from VisionForge AI.',
};

export default function BlogPage() {
  return (
    <main className="container mx-auto py-12 px-4">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-3">
          VisionForge <span className="text-accent">Blog</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Your essential resource for mastering AI art. Discover tutorials, inspiration, and the latest trends in image generation.
        </p>
      </header>
      <BlogSection />
    </main>
  );
}
