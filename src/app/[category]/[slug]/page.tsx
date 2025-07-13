
import { getArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, List } from 'lucide-react';
import type { Metadata } from 'next';
import { categorySlugMap } from '@/lib/constants';
import { cn } from '@/lib/utils';
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
    title: article.title,
    description: description,
  };
}

// Function to extract H2 headings for Table of Contents
const getTableOfContents = (content: Article['articleContent']) => {
    return content
        .filter(block => block.type === 'h2')
        .map(block => ({
            title: block.content,
            slug: block.content.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        }));
};

// Main component for rendering the article page
export default async function ArticlePage({ params }: { params: { category: string; slug: string } }) {
    const article = await getArticleData(params.category, params.slug);

    if (!article) {
        notFound();
    }

    const toc = getTableOfContents(article.articleContent);

    // Component to render individual content blocks
    const renderContentBlock = (block: Article['articleContent'][0], index: number) => {
        const slug = block.type === 'h2' 
            ? block.content.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
            : undefined;

        switch (block.type) {
            case 'h2':
                return <h2 key={index} id={slug} className="text-3xl font-bold mt-12 mb-4 border-b pb-2 scroll-mt-24">{block.content}</h2>;
            case 'h3':
                return <h3 key={index} className="text-2xl font-semibold mt-10 mb-3">{block.content}</h3>;
            case 'h4':
                return <h4 key={index} className="text-xl font-semibold mt-8 mb-2">{block.content}</h4>;
            case 'h5':
                return <h5 key={index} className="text-lg font-semibold mt-6 mb-2">{block.content}</h5>;
            case 'h6':
                return <h6 key={index} className="text-base font-semibold mt-6 mb-2">{block.content}</h6>;
            case 'p':
                 // First paragraph (summary) is now handled outside the loop
                return <p key={index} className="mb-6 leading-relaxed text-foreground/90">{block.content}</p>;
            default:
                return <p key={index}>{block.content}</p>;
        }
    };
    
    const summaryParagraph = article.articleContent.find(block => block.type === 'p');
    const contentWithoutSummary = summaryParagraph ? article.articleContent.slice(1) : article.articleContent;

    return (
        <main className="container mx-auto py-12 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Article Content */}
                <article className="lg:col-span-9">
                    <header className="mb-8">
                        <Badge variant="secondary" className="mb-4">{article.category}</Badge>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">{article.title}</h1>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden mt-6 shadow-lg">
                            <Image
                                src={article.image}
                                alt={article.title}
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint={article.dataAiHint}
                                priority
                            />
                        </div>
                    </header>

                    {/* Summary Paragraph */}
                    {summaryParagraph && (
                        <p className="text-lg text-muted-foreground leading-relaxed my-8 border-l-4 border-primary pl-4">
                            {summaryParagraph.content}
                        </p>
                    )}

                    <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 mt-12">
                        {contentWithoutSummary.map(renderContentBlock)}
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
                                                <span className="text-foreground/80">{takeaway}</span>
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
                            <p className="text-lg text-foreground/90 leading-relaxed">{article.conclusion}</p>
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
