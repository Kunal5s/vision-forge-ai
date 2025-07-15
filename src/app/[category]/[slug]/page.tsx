
import { getArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, List } from 'lucide-react';
import type { Metadata } from 'next';
import { categorySlugMap } from '@/lib/constants';
import type { Article } from '@/lib/articles';
import { cn } from '@/lib/utils';
import parse from 'html-react-parser';


// Function to find the article
async function getArticleData(categorySlug: string, articleSlug: string): Promise<Article | undefined> {
    const categoryName = Object.entries(categorySlugMap).find(([, slug]) => slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug)?.[1];
    if (!categoryName) return undefined;
    
    // Use the public getArticles which only fetches 'published' articles
    const articles = await getArticles(categoryName);
    const article = articles.find(article => article.slug === articleSlug);

    // If an article is found, it must be published. If not found, it's either a draft or doesn't exist.
    if (!article) return undefined;

    return article;
}

// Function to generate metadata
export async function generateMetadata({ params }: { params: { category: string; slug: string } }): Promise<Metadata> {
  const article = await getArticleData(params.category, params.slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }
  
  const description = (article.summary || article.articleContent.find(c => c.type === 'p')?.content || '').substring(0, 160);

  return {
    title: article.title.replace(/<[^>]*>?/gm, ''), // Strip HTML for metadata
    description: description.replace(/<[^>]*>?/gm, ''), // Strip HTML for metadata
  };
}

// Main component for rendering the article page
export default async function ArticlePage({ params }: { params: { category: string; slug: string } }) {
    const article = await getArticleData(params.category, params.slug);

    if (!article) {
        notFound();
    }
    
    const getTableOfContents = (content: Article['articleContent']) => {
        return content
            .filter(block => block.type === 'h2')
            .map(block => {
                const title = block.content.replace(/<[^>]*>?/gm, '');
                return {
                  title,
                  slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
                }
            });
    };
    
    const toc = getTableOfContents(article.articleContent);

    const renderContentBlock = (block: Article['articleContent'][0], index: number) => {
        const slug = block.type === 'h2' 
            ? block.content.replace(/<[^>]*>?/gm, '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
            : undefined;
        
        const processedContent = parse(block.content);

        switch (block.type) {
            case 'h2':
                return <h2 key={index} id={slug} className="scroll-mt-24">{processedContent}</h2>;
            case 'h3':
                return <h3 key={index}>{processedContent}</h3>;
            case 'h4':
                return <h4 key={index}>{processedContent}</h4>;
            case 'h5':
                return <h5 key={index}>{processedContent}</h5>;
            case 'h6':
                return <h6 key={index}>{processedContent}</h6>;
            case 'p':
                 return <p key={index}>{processedContent}</p>;
            case 'img':
                 return (
                    <div key={index} className="my-8">
                      <Image
                        src={block.content}
                        alt={block.alt || 'Article image'}
                        width={800}
                        height={450}
                        className="rounded-lg shadow-lg mx-auto"
                        data-ai-hint="in-article photography"
                      />
                    </div>
                  );
            default:
                return <div key={index}>{processedContent}</div>;
        }
    };
    
    return (
        <main className="container mx-auto py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <Badge variant="secondary" className="mb-4">{article.category}</Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">{parse(article.title)}</h1>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden mt-6 shadow-lg">
                        <Image
                            src={article.image}
                            alt={article.title.replace(/<[^>]*>?/gm, '')}
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint={article.dataAiHint}
                            priority
                        />
                    </div>
                </header>

                {article.summary && article.summary.length > 10 && (
                    <Card className="my-8 bg-muted/50 border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                                <BookOpen className="h-6 w-6 text-primary" />
                                Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {parse(article.summary)}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {toc.length > 0 && (
                     <Card className="my-8 bg-muted/50 border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                                <List className="h-6 w-6 text-primary" />
                                Table of Contents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {toc.map((item, index) => (
                                    <li key={index}>
                                        <a href={`#${item.slug}`} className="text-foreground/80 hover:text-primary transition-colors">
                                            {item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
                
                <article className="prose dark:prose-invert max-w-none">
                    {article.articleContent.map(renderContentBlock)}
                </article>
                
                {article.keyTakeaways && article.keyTakeaways.length > 0 && (
                    <section className="my-12">
                        <Card className="bg-muted/50 border-border">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold">Key Takeaways</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {article.keyTakeaways.map((takeaway, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                                            <span className="text-foreground/80">{parse(takeaway)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {article.conclusion && (
                     <div className="prose dark:prose-invert max-w-none space-y-6 mt-12">
                        <h2>Conclusion</h2>
                        <div>{parse(article.conclusion)}</div>
                    </div>
                )}
            </div>
        </main>
    );
}
