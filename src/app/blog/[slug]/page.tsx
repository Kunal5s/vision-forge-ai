
import { notFound } from 'next/navigation';
import { articles } from '@/lib/blog-data';
import type { Metadata, ResolvingMetadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  params: { slug: string };
};

// Find the article across all categories
const allArticles = Object.values(articles).flat();
const getArticle = (slug: string) => allArticles.find((article) => article.slug === slug);

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const article = getArticle(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found | VisionForge AI',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const description = article.content.replace(/<[^>]*>?/gm, '').substring(0, 160);

  return {
    title: `${article.title} | VisionForge AI Blog`,
    description: description,
    openGraph: {
      title: article.title,
      description: description,
      images: ['/og-image-blog.png', ...previousImages], // Placeholder OG image
    },
  };
}

export default function ArticlePage({ params }: Props) {
  const article = getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Button asChild variant="outline" className="futuristic-glow-button">
                <Link href="/blog">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Blog
                </Link>
            </Button>
        </div>
        <article className="prose prose-invert prose-lg max-w-none 
          prose-h1:text-primary prose-h1:text-4xl prose-h1:md:text-5xl prose-h1:font-extrabold
          prose-h2:text-accent prose-h2:border-b prose-h2:border-accent/30 prose-h2:pb-2
          prose-h3:text-primary/90
          prose-a:text-primary hover:prose-a:text-accent
          prose-strong:text-foreground
          prose-blockquote:border-accent
          prose-code:text-accent-foreground prose-code:bg-accent/10 prose-code:p-1 prose-code:rounded-sm">
          <h1 className="mb-4">{article.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>
      </div>
    </main>
  );
}

// This function allows Next.js to pre-render all blog posts at build time
export async function generateStaticParams() {
  return allArticles.map((article) => ({
    slug: article.slug,
  }));
}
