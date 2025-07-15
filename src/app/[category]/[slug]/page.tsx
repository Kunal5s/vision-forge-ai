
import { getArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, List } from 'lucide-react';
import type { Metadata } from 'next';
import { categorySlugMap } from '@/lib/constants';
import type { Article } from '@/lib/articles';
import { cn } from '@/lib/utils';
import parse from 'html-react-parser';


// Function to find the article
async function getArticleData(categorySlug: string, articleSlug: string): Promise<Article | undefined> {
    const categoryName = Object.entries(categorySlugMap).find(([, slug]) => slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug)?.[1];
    if (!categoryName) return undefined;
    
    const articles = await getArticles(categoryName);
    return articles.find(article => article.slug === articleSlug);
}

// Function to generate metadata
export async function generateMetadata({ params }: { params: { category: string; slug: string } }): Promise<Metadata> {
  const article = await getArticleData(params.category, params.slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }
  
  const description = (article.articleContent.find(c => c.type === 'p')?.content || '').substring(0, 160);

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
                return <h2 key={index} id={slug} className="text-3xl font-bold mt-12 mb-4 border-b pb-2 scroll-mt-24">{processedContent}</h2>;
            case 'h3':
                return <h3 key={index} className="text-2xl font-bold mt-10 mb-3">{processedContent}</h3>;
            case 'h4':
                return <h4 key={index} className="text-xl font-semibold mt-8 mb-2">{processedContent}</h4>;
            case 'h5':
                return <h5 key={index} className="text-lg font-semibold mt-6 mb-2">{processedContent}</h5>;
            case 'h6':
                return <h6 key={index} className="text-base font-semibold mt-6 mb-2">{processedContent}</h6>;
            case 'p':
                 return <p key={index} className="mb-6 leading-relaxed">{processedContent}</p>;
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <article className="lg:col-span-9 prose prose-lg dark:prose-invert max-w-none text-foreground/90">
                    <header className="mb-8 not-prose">
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
                    
                    <div className="mt-12">
                        {article.articleContent.map(renderContentBlock)}
                    </div>
                    
                    {article.keyTakeaways && article.keyTakeaways.length > 0 && (
                        <section className="my-12 not-prose">
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
                         <div className="space-y-6 mt-12">
                            <h2 className="text-3xl font-bold border-b pb-2">Conclusion</h2>
                            <div>{parse(article.conclusion)}</div>
                        </div>
                    )}
                </article>

                <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
                    <Card className={cn("bg-background/80 backdrop-blur-sm animate-breathing-glow")}>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <List className="h-5 w-5" />
                                Table of Contents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-2 list-inside list-decimal">
                                {toc.map((item, index) => (
                                    <li key={item.slug} className="ml-4">
                                        <a 
                                            href={`#${item.slug}`} 
                                            className="text-sm text-foreground hover:text-primary hover:underline transition-colors"
                                        >
                                          {parse(item.title)}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </main>
    );
}
