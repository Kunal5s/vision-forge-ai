
import { getStoryBySlug, getStories } from '@/lib/stories';
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

  const description = story.pages[0]?.content?.body || `A web story about ${story.title}.`;

  return {
    title: `${story.title} | Web Story`,
    description: description.substring(0, 160),
    openGraph: {
      title: story.title,
      description: description,
      type: 'article',
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
      description: description,
      images: [story.cover],
    },
  };
}

// This function generates the static paths for all stories at build time.
export async function generateStaticParams() {
    // For now, as stories are dynamic, we can return an empty array
    // and rely on on-demand rendering. In the future, we can fetch all stories.
    // Example:
    // const stories = await getStories('featured'); // Assuming one category for now
    // return stories.map((story) => ({
    //   slug: story.slug,
    // }));
    return [];
}


export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await getStoryBySlug(params.slug);

  if (!story) {
    notFound();
  }

  return <StoryPlayer story={story} />;
}
