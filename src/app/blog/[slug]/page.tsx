
import { notFound } from 'next/navigation';
import { articles, Article } from '@/lib/blog-data';
import type { Metadata, ResolvingMetadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { generateBlogArticle } from '@/ai/flows/generate-blog-article';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

type Props = {
  params: { slug: string };
};

// Find the article across all categories
const allArticles = Object.values(articles).flat();
const getArticleData = (slug: string): Article | undefined => allArticles.find((article) => article.slug === slug);

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const article = getArticleData(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found | VisionForge AI',
    };
  }

  const description = `Live AI-generated article on: ${article.title}. Explore the latest trends and techniques in AI image generation with VisionForge AI.`;

  return {
    title: `${article.title} | VisionForge AI Blog`,
    description: description,
    openGraph: {
      title: article.title,
      description: description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const articleData = getArticleData(params.slug);

  if (!articleData) {
    notFound();
  }

  // Generate the article content in real-time using the AI flow
  const articleContent = await generateBlogArticle({ 
    topic: articleData.title, 
    category: articleData.category 
  });

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

        <Alert className="mb-8 bg-primary/10 border-primary/30 text-primary-foreground">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="text-primary">Live AI-Generated Content!</AlertTitle>
          <AlertDescription>
            This article was generated in real-time by VisionForge AI, just for you. Enjoy the latest insights on this topic.
          </AlertDescription>
        </Alert>

        <article className="prose prose-invert prose-xl max-w-none 
          prose-p:leading-relaxed prose-p:text-foreground/80
          prose-h1:text-primary prose-h1:text-4xl prose-h1:md:text-5xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:mb-8
          prose-h2:text-accent prose-h2:border-b prose-h2:border-accent/40 prose-h2:pb-3 prose-h2:mt-16 prose-h2:mb-6 prose-h2:font-bold
          prose-h3:text-primary/90 prose-h3:mt-10 prose-h3:mb-4 prose-h3:font-semibold
          prose-h4:text-accent/90 prose-h4:mt-8 prose-h4:mb-2 prose-h4:font-semibold
          prose-a:text-primary hover:prose-a:text-accent prose-a:transition-colors
          prose-strong:text-foreground
          prose-blockquote:border-accent prose-blockquote:text-muted-foreground prose-blockquote:text-lg
          prose-code:text-accent-foreground prose-code:bg-accent/10 prose-code:p-1 prose-code:rounded-sm
          prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-primary
          prose-ol:list-decimal prose-ol:pl-6 prose-li:marker:text-primary">
          <div dangerouslySetInnerHTML={{ __html: articleContent.articleContent }} />
        </article>
      </div>
    </main>
  );
}
