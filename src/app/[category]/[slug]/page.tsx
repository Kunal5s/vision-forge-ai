
import { getArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { categorySlugMap } from '@/lib/constants';
import { cn } from '@/lib/utils';


interface ArticleContentBlock {
    type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
    content: string;
}

interface Article {
    image: string;
    dataAiHint: string;
    category: string;
    title: string;
    slug: string;
    articleContent: ArticleContentBlock[] | string;
    keyTakeaways: string[];
    conclusion: string;
}

async function getArticleData(categorySlug: string, articleSlug: string): Promise<Article | undefined> {
    const categoryName = categorySlugMap[categorySlug];
    if (!categoryName) return undefined;
    
    const articles = await getArticles(categoryName);
    return articles.find(article => article.slug === articleSlug);
}

export async function generateMetadata({ params }: { params: { category: string; slug: string } }): Promise<Metadata> {
  const article = await getArticleData(params.category, params.slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }
  
  const description = Array.isArray(article.articleContent)
    ? (article.articleContent.find(c => c.type === 'p')?.content || '').substring(0, 160)
    : (article.articleContent as string).substring(0, 160);

  return {
    title: article.title,
    description: description,
  };
}

const renderContentBlock = (item: ArticleContentBlock, index: number) => {
    switch (item.type) {
        case 'h1':
            return <h1 key={index}>{item.content}</h1>;
        case 'h2':
            return <h2 key={index}>{item.content}</h2>;
        case 'h3':
            return <h3 key={index}>{item.content}</h3>;
        case 'h4':
            return <h4 key={index}>{item.content}</h4>;
        case 'h5':
            return <h5 key={index}>{item.content}</h5>;
        case 'h6':
            return <h6 key={index}>{item.content}</h6>;
        case 'p':
            return <p key={index}>{item.content}</p>;
        default:
            return null;
    }
}

export default async function ArticlePage({ params }: { params: { category: string; slug: string } }) {
    const article = await getArticleData(params.category, params.slug);

    if (!article) {
        notFound();
    }

    return (
        <main className="container mx-auto py-12 px-4">
            <article className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <Badge variant="secondary" className="mb-4">{article.category}</Badge>
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

                <div className={cn(
                  "prose prose-lg dark:prose-invert max-w-none text-foreground/90",
                  "prose-h1:text-4xl prose-h1:md:text-5xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:text-foreground prose-h1:mb-4",
                  "prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2",
                  "prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-3",
                  "prose-h4:text-xl prose-h4:font-semibold prose-h4:mt-8 prose-h4:mb-2",
                  "prose-h5:text-lg prose-h5:font-semibold prose-h5:mt-6 prose-h5:mb-2",
                  "prose-h6:text-base prose-h6:font-semibold prose-h6:mt-6 prose-h6:mb-2",
                  "prose-p:mb-6 prose-p:leading-relaxed"
                )}>
                     {Array.isArray(article.articleContent) ? (
                        article.articleContent.map(renderContentBlock)
                     ) : (
                        // Fallback for old string format
                        <>
                            <h1>{article.title}</h1>
                            {(article.articleContent as string).split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </>
                    )}
                </div>

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

                <div className="space-y-6">
                    <h2 className="text-3xl font-bold border-b pb-2">Conclusion</h2>
                    <p className="text-lg text-foreground/90 leading-relaxed">{article.conclusion}</p>
                </div>

            </article>
        </main>
    );
}
