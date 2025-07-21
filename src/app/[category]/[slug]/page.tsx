
import { getArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, BookOpen, List, CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { categorySlugMap } from '@/lib/constants';
import type { Article, ArticleContentBlock } from '@/lib/articles';
import { cn } from '@/lib/utils';
import parse, { domToReact } from 'html-react-parser';
import { format } from 'date-fns';
import { AuthorBio } from '@/components/vision-forge/AuthorBio';
import { getAuthorData } from '@/app/admin/dashboard/author/actions';

// Function to find the article
async function getArticleData(categorySlug: string, articleSlug: string): Promise<Article | undefined> {
    const categoryName = Object.entries(categorySlugMap).find(([slug]) => slug === categorySlug)?.[1];
    if (!categoryName) {
        // Fallback for slugs that don't match the map key but might match the name
        const fallbackCategory = Object.values(categorySlugMap).find(name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug);
        if (!fallbackCategory) return undefined;
        
        const articles = await getArticles(fallbackCategory);
        return articles.find(article => article.slug === articleSlug);
    }
    
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
            .filter(block => ['h2', 'h3', 'h4', 'h5', 'h6'].includes(block.type))
            .map(block => {
                const title = block.content.replace(/<[^>]*>?/gm, '');
                return {
                  title,
                  level: parseInt(block.type.replace('h', ''), 10),
                  slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
                }
            });
    };
    
    const toc = getTableOfContents(article.articleContent);
    const author = await getAuthorData();

    // Find the index of the "Key Takeaways" heading
    const keyTakeawaysHeadingIndex = article.articleContent.findIndex(block => 
        block.type === 'h2' && block.content.toLowerCase().includes('key takeaways')
    );
    
    let keyTakeawaysList: ArticleContentBlock | null = null;
    if (keyTakeawaysHeadingIndex !== -1 && article.articleContent[keyTakeawaysHeadingIndex + 1]?.type === 'ul') {
        keyTakeawaysList = article.articleContent[keyTakeawaysHeadingIndex + 1];
    }
    
    const renderContentBlock = (block: ArticleContentBlock, index: number) => {
        // Skip rendering the original "Key Takeaways" heading and list if we found them
        if (keyTakeawaysList && (index === keyTakeawaysHeadingIndex || index === keyTakeawaysHeadingIndex + 1)) {
            return null;
        }

        const slug = ['h2', 'h3', 'h4', 'h5', 'h6'].includes(block.type)
            ? block.content.replace(/<[^>]*>?/gm, '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
            : undefined;

        // Custom parser options to handle tables
        const parsedContent = parse(block.content, {
            replace: (domNode: any) => {
                if (domNode.name === 'table') {
                    return <div className="overflow-x-auto my-6"><table className="min-w-full divide-y divide-border">{domNode.children.map((child: any, i: number) => parse(child.data, { replace: (childNode: any) => {
                        if (childNode.name === 'tr') return <tr className="divide-x divide-border">{childNode.children.map((cell: any, j: number) => parse(cell.data))}</tr>
                    } }))}</table></div>;
                }
            }
        });

        switch (block.type) {
            case 'h2':
                return <h2 key={index} id={slug} className="scroll-mt-24">{parsedContent}</h2>;
            case 'h3':
                return <h3 key={index} id={slug}>{parsedContent}</h3>;
            case 'h4':
                return <h4 key={index} id={slug}>{parsedContent}</h4>;
            case 'h5':
                return <h5 key={index} id={slug}>{parsedContent}</h5>;
            case 'h6':
                return <h6 key={index} id={slug}>{parsedContent}</h6>;
            case 'p':
                 return <p key={index}>{parsedContent}</p>;
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
                return <div key={index}>{parsedContent}</div>;
        }
    };
    
    return (
        <main className="container mx-auto py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <Badge variant="secondary" className="mb-4">{article.category}</Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">{parse(article.title)}</h1>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <time dateTime={article.publishedDate}>
                          Published on {format(new Date(article.publishedDate), 'MMMM d, yyyy')}
                        </time>
                    </div>
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
                            <div className="prose dark:prose-invert max-w-none prose-p:text-lg">
                                {parse(article.summary)}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                <li key={index} style={{ marginLeft: `${(item.level - 2) * 1.5}rem` }}>
                                    <a href={`#${item.slug}`} className="text-foreground/80 hover:text-primary transition-colors">
                                        {item.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                
                <article className="prose lg:prose-xl dark:prose-invert max-w-none space-y-6">
                    {article.articleContent.map(renderContentBlock)}
                </article>
                
                {keyTakeawaysList && (
                    <section className="my-12">
                        <Card className="bg-muted/50 border-border">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold">Key Takeaways</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {parse(keyTakeawaysList.content, {
                                     replace: (domNode: any) => {
                                        if (domNode.name === 'ul') {
                                            return <ul className="space-y-4 list-none p-0">{domToReact(domNode.children)}</ul>;
                                        }
                                        if (domNode.name === 'li') {
                                            return (
                                                <li className="flex items-start gap-3">
                                                    <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                                                    <span className="text-foreground/80">{domToReact(domNode.children)}</span>
                                                </li>
                                            )
                                        }
                                     }
                                })}
                            </CardContent>
                        </Card>
                    </section>
                )}
                
                <div className="mt-16 pt-8 border-t">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">About the Author</h2>
                    <AuthorBio author={author} />
                </div>
            </div>
        </main>
    );
}
