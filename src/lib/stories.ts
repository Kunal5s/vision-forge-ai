
'use server';

import { z } from 'zod';

// Direct imports for reliability
import featuredStories from '@/stories/featured.json';

const StoryPageContentSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});

const StoryPageSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().url(),
  dataAiHint: z.string(),
  content: StoryPageContentSchema.optional(),
});
export type StoryPage = z.infer<typeof StoryPageSchema>;

const StorySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  cover: z.string().url(),
  dataAiHint: z.string(),
  category: z.string(),
  publishedDate: z.string().datetime(),
  status: z.enum(['published', 'draft']).default('published'),
  pages: z.array(StoryPageSchema),
});
export type Story = z.infer<typeof StorySchema>;

const StoryFileSchema = z.array(StorySchema);

// A map to hold all imported story data
const allStoryData: { [key: string]: any } = {
    'featured': featuredStories,
};

async function loadAndValidateStories(category: string): Promise<Story[]> {
    const storyData = allStoryData[category.toLowerCase()];

    if (!storyData) {
        console.warn(`No story data found for category "${category}"`);
        return [];
    }
    
    try {
        const validatedStories = StoryFileSchema.safeParse(storyData);

        if (validatedStories.success) {
            return validatedStories.data;
        } else {
            console.error(`Zod validation failed for stories in category "${category}".`, validatedStories.error.flatten());
            return [];
        }

    } catch (error: any) {
        console.error(`Error validating stories for category "${category}":`, error.message);
        return [];
    }
}

// Gets only published stories
export async function getStories(category: string): Promise<Story[]> {
    const allStories = await loadAndValidateStories(category);
    return allStories.filter(story => story.status === 'published');
}

// Gets all stories, including drafts (for admin)
export async function getAllStoriesAdmin(category: string): Promise<Story[]> {
    return loadAndValidateStories(category);
}

// Get a single story by its slug from any category
export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
    const allCategories = Object.keys(allStoryData);
    for (const category of allCategories) {
        const stories = await getStories(category);
        const foundStory = stories.find(story => story.slug === slug);
        if (foundStory) {
            return foundStory;
        }
    }
    return undefined;
}
