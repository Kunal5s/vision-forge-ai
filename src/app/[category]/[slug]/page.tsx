
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
    articleContent: ArticleContentBlock[];
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
  
  const description = (article.articleContent.find(c => c.type === 'p')?.content || '').substring(0, 160);

  return {
    title: article.title,
    description: description,
  };
}

const renderContentBlock = (block: ArticleContentBlock, index: number) => {
    switch (block.type) {
        case 'h1':
            return <h1 key={index} className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">{block.content}</h1>;
        case 'h2':
            return <h2 key={index} className="text-3xl font-bold mt-12 mb-4 border-b pb-2">{block.content}</h2>;
        case 'h3':
            return <h3 key={index} className="text-2xl font-semibold mt-10 mb-3">{block.content}</h3>;
        case 'h4':
            return <h4 key={index} className="text-xl font-semibold mt-8 mb-2">{block.content}</h4>;
        case 'h5':
            return <h5 key={index} className="text-lg font-semibold mt-6 mb-2">{block.content}</h5>;
        case 'h6':
            return <h6 key={index} className="text-base font-semibold mt-6 mb-2">{block.content}</h6>;
        case 'p':
            return <p key={index} className="mb-6 leading-relaxed">{block.content}</p>;
        default:
            return <p key={index}>{block.content}</p>;
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

                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90">
                    {article.articleContent.map(renderContentBlock)}
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
