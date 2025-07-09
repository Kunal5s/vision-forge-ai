
import { getArticles } from '@/lib/articles';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';

interface ArticleContentBlock {
    type: 'h2' | 'h3' | 'p';
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

const categorySlugToName: { [key: string]: string } = {
    'featured': 'Featured',
    'prompts': 'Prompts',
    'styles': 'Styles',
    'tutorials': 'Tutorials',
    'storybook': 'Storybook',
    'usecases': 'Usecases',
    'inspiration': 'Inspiration',
    'trends': 'Trends',
    'technology': 'Technology',
    'nft': 'NFT'
};

async function getArticleData(categorySlug: string, articleSlug: string): Promise<Article | undefined> {
    const categoryName = categorySlugToName[categorySlug];
    if (!categoryName) return undefined;
    
    const articles = await getArticles(categoryName, []);
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
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
                        {article.title}
                    </h1>
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

                <div className="text-lg text-foreground/90 leading-relaxed">
                     {Array.isArray(article.articleContent) ? article.articleContent.map((item, index) => {
                        switch (item.type) {
                            case 'h2':
                                return <h2 key={index} className="text-3xl font-bold mt-10 mb-4 border-b pb-2">{item.content}</h2>;
                            case 'h3':
                                return <h3 key={index} className="text-2xl font-semibold mt-8 mb-3">{item.content}</h3>;
                            case 'p':
                                return <p key={index} className="mb-6">{item.content}</p>;
                            default:
                                return null;
                        }
                    }) : (
                        // Fallback for old string format for backward compatibility
                        (article.articleContent as string).split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                            <p key={index} className="mb-6">{paragraph}</p>
                        ))
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
