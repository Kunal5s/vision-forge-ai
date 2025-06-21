
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { articles, type Article } from '@/lib/blog-data';
import { ArrowLeft, Terminal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { generateBlogArticle } from '@/ai/flows/generate-blog-article';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/vision-forge/LoadingSpinner';

// Find the article across all categories
const allArticles = Object.values(articles).flat();
const getArticleData = (slug: string): Article | undefined => allArticles.find((article) => article.slug === slug);

export default function ArticlePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [articleContent, setArticleContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [articleData, setArticleData] = useState<Article | null>(null);
  
  useEffect(() => {
    if (slug) {
      const data = getArticleData(slug);
      if (data) {
        setArticleData(data);
        document.title = `${data.title} | VisionForge AI Blog`;
      } else {
        notFound();
      }
    }
  }, [slug]);

  useEffect(() => {
    if (articleData) {
      const fetchArticle = async () => {
        setIsLoading(true);
        setArticleContent(''); // Clear previous content
        
        try {
          // Set a 25-second timeout for the client-side request
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 25000)
          );

          const generationPromise = generateBlogArticle({ 
            topic: articleData.title, 
            category: articleData.category 
          });

          // Race the generation against the timeout
          const result = await Promise.race([generationPromise, timeoutPromise]);

          if (result.error) {
            // The flow now returns HTML with the error message, so we can set it directly.
            setArticleContent(result.articleContent);
          } else {
            setArticleContent(result.articleContent);
          }

        } catch (error: any) {
          console.error("Failed to generate or fetch blog article:", error);
          let errorHtml = `<h1>Oops! Something Went Wrong</h1><p>We encountered an unexpected server error while trying to generate this article. Please try refreshing the page or check the server logs.</p>`;
          
          if (error.message === 'timeout') {
            errorHtml = `<h1>Content Generation Timed Out</h1>
                         <p>The request to the AI model took too long to complete. This is a common issue on free hosting platforms like Netlify, which have short execution time limits for server functions.</p>
                         <p><strong>Please try refreshing the page.</strong> If the problem persists, the platform may be under heavy load.</p>`;
          }
          
          setArticleContent(errorHtml);
        } finally {
          setIsLoading(false);
        }
      };

      fetchArticle();
    }
  }, [articleData]);

  if (!articleData && !isLoading) {
    // This will be handled by the notFound() in useEffect, but as a fallback.
    return null;
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

        <Alert className="mb-8 bg-primary/10 border-primary/30 text-primary-foreground">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="text-primary">Live AI-Generated Content!</AlertTitle>
          <AlertDescription>
            {isLoading ? 'Your article is being generated in real-time by VisionForge AI...' : 'This article was generated in real-time by VisionForge AI, just for you.'}
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <LoadingSpinner size={64} />
            <p className="text-lg font-semibold text-foreground animate-pulse">Forging Knowledge...</p>
            <p className="text-muted-foreground text-center">The AI is writing a unique article for you. This may take up to a minute.</p>
          </div>
        ) : (
          <article className="prose prose-invert prose-xl max-w-none 
            prose-p:leading-relaxed prose-p:text-foreground/80
            prose-h1:text-primary prose-h1:text-4xl prose-h1:md:text-5xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:mb-8
            prose-h2:text-accent prose-h2:border-b prose-h2:border-accent/40 prose-h2:pb-3 prose-h2:mt-16 prose-h2:mb-6 prose-h2:font-bold
            prose-h3:text-primary/90 prose-h3:mt-10 prose-h3:mb-4 prose-h3:font-semibold
            prose-h4:text-accent/90 prose-h4:mt-8 prose-h4:mb-2 prose-h4:font-semibold
            prose-h5:text-primary/80 prose-h5:mt-6 prose-h5:mb-2 prose-h5:font-semibold
            prose-h6:text-accent/80 prose-h6:mt-5 prose-h6:mb-1 prose-h6:font-medium
            prose-a:text-primary hover:prose-a:text-accent prose-a:transition-colors
            prose-strong:text-foreground
            prose-blockquote:border-accent prose-blockquote:text-muted-foreground prose-blockquote:text-lg
            prose-code:text-accent-foreground prose-code:bg-accent/10 prose-code:p-1 prose-code:rounded-sm
            prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-primary
            prose-ol:list-decimal prose-ol:pl-6 prose-li:marker:text-primary">
            <div dangerouslySetInnerHTML={{ __html: articleContent }} />
          </article>
        )}
      </div>
    </main>
  );
}
