
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
  url: z.string().min(1), // Can be a standard URL or a Data URI
  dataAiHint: z.string(),
  styleName: z.string().optional(),
  content: StoryPageContentSchema.optional(),
});
export type StoryPage = z.infer<typeof StoryPageSchema>;

const StorySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  seoDescription: z.string().optional().default(''),
  logo: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  author: z.string().optional().default('Imagen BrainAi'),
  cover: z.string().min(1), // Can be a standard URL or a Data URI
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
    // This function will be replaced with Xata client calls.
    const storyData = allStoryData[category.toLowerCase()];

    if (!storyData) {
        console.warn(`No story data found for category "${category}"`);
        return [];
    }
    
    try {
        const validatedStories = StoryFileSchema.safeParse(storyData);

        if (validatedStories.success) {
            return validatedStories.data.map(story => ({
                ...story,
                seoDescription: story.seoDescription || story.pages[0]?.content?.body?.substring(0, 160) || story.title,
                author: story.author || 'Imagen BrainAi'
            }));
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
    // This will be replaced with a Xata query
    const allStories = await loadAndValidateStories(category);
    return allStories
        .filter(story => story.status === 'published')
        .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}

// Gets all stories, including drafts (for admin)
export async function getAllStoriesAdmin(category: string): Promise<Story[]> {
     // This will be replaced with a Xata query
     const allStories = await loadAndValidateStories(category);
     return allStories.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}

// Get a single story by its slug from any category
export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
    // This will be a single query to the database
    const allCategories = Object.keys(allStoryData);
    for (const category of allCategories) {
        const stories = await getAllStoriesAdmin(category);
        const foundStory = stories.find(story => story.slug === slug);
        if (foundStory) {
            return foundStory;
        }
    }
    return undefined;
}
