
import { getArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, List } from 'lucide-react';
import type { Metadata } from 'next';
import { categorySlugMap } from '@/lib/constants';
import type { Article } from '@/lib/articles';

// Function to find the article
async function getArticleData(categorySlug: string, articleSlug: string): Promise<Article | undefined> {
    const categoryName = categorySlugMap[categorySlug];
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
    title: article.title.replace(/\*{1,2}(.*?)\*{1,2}/g, '$1'),
    description: description.replace(/\*{1,2}(.*?)\*{1,2}/g, '$1'),
  };
}

// Main component for rendering the article page
export default async function ArticlePage({ params }: { params: { category: string; slug: string } }) {
    const article = await getArticleData(params.category, params.slug);

    if (!article) {
        notFound();
    }
    
    // Universal cleaning function to remove asterisks from any text
    const cleanText = (text: string = ''): string => {
        return text.replace(/\*{1,2}(.*?)\*{1,2}/g, '$1');
    };

    // Function to extract H2 headings for Table of Contents, now cleaned
    const getTableOfContents = (content: Article['articleContent']) => {
        return content
            .filter(block => block.type === 'h2')
            .map(block => ({
                title: cleanText(block.content),
                slug: cleanText(block.content).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            }));
    };
    
    const toc = getTableOfContents(article.articleContent);

    // Component to render individual content blocks, now with cleaning
    const renderContentBlock = (block: Article['articleContent'][0], index: number) => {
        const cleanedContent = cleanText(block.content);
        const slug = block.type === 'h2' 
            ? cleanedContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
            : undefined;

        switch (block.type) {
            case 'h2':
                return <h2 key={index} id={slug} className="text-3xl font-bold mt-12 mb-4 border-b pb-2 scroll-mt-24">{cleanedContent}</h2>;
            case 'h3':
                return <h3 key={index} className="text-2xl font-semibold mt-10 mb-3">{cleanedContent}</h3>;
            case 'h4':
                return <h4 key={index} className="text-xl font-semibold mt-8 mb-2">{cleanedContent}</h4>;
            case 'h5':
                return <h5 key={index} className="text-lg font-semibold mt-6 mb-2">{cleanedContent}</h5>;
            case 'h6':
                return <h6 key={index} className="text-base font-semibold mt-6 mb-2">{cleanedContent}</h6>;
            case 'p':
                 return <p key={index} className="mb-6 leading-relaxed text-foreground/90">{cleanedContent}</p>;
            default:
                return <p key={index}>{cleanedContent}</p>;
        }
    };
    
    return (
        <main className="container mx-auto py-12 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Article Content */}
                <article className="lg:col-span-9">
                    <header className="mb-8">
                        <Badge variant="secondary" className="mb-4">{article.category}</Badge>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">{cleanText(article.title)}</h1>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden mt-6 shadow-lg">
                            <Image
                                src={article.image}
                                alt={cleanText(article.title)}
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint={article.dataAiHint}
                                priority
                            />
                        </div>
                    </header>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 mt-12">
                        {article.articleContent.map(renderContentBlock)}
                    </div>
                    
                    {/* Key Takeaways Section */}
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
                                                <span className="text-foreground/80">{cleanText(takeaway)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>
                    )}

                    {/* Conclusion Section */}
                    {article.conclusion && (
                         <div className="space-y-6 mt-12">
                            <h2 className="text-3xl font-bold border-b pb-2">Conclusion</h2>
                            <p className="text-lg text-foreground/90 leading-relaxed">{cleanText(article.conclusion)}</p>
                        </div>
                    )}
                </article>

                {/* Table of Contents (Sticky Sidebar) */}
                <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
                    <Card className="bg-background/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <List className="h-5 w-5" />
                                Table of Contents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {toc.map(item => (
                                    <li key={item.slug}>
                                        <a 
                                            href={`#${item.slug}`} 
                                            className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                                        >
                                            {item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </main>
    );
}
