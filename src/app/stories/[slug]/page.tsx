
import { getStoryBySlug } from '@/lib/stories';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StoryPlayer } from '@/components/vision-forge/StoryPlayer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const story = await getStoryBySlug(params.slug);

  if (!story) {
    return {
      title: 'Story Not Found',
    };
  }

  return {
    title: story.title,
    description: story.seoDescription,
    openGraph: {
      title: story.title,
      description: story.seoDescription,
      type: 'article',
      publishedTime: story.publishedDate,
      authors: [story.author],
      images: [
        {
          url: story.cover,
          width: 1080,
          height: 1920,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description: story.seoDescription,
      images: [story.cover],
    },
  };
}

export default async function StoryPage({ params }: { params: { slug:string } }) {
  const story = await getStoryBySlug(params.slug);

  if (!story) {
    notFound();
  }

  return <StoryPlayer story={story} />;
}
