
// src/scripts/generate-all-articles.ts
import 'dotenv/config'; // Load environment variables from .env file
import { generateSingleArticle, saveArticlesForCategory, getArticles } from '../lib/articles';
import { 
    categorySlugMap, featuredTopics, promptsTopics, stylesTopics, tutorialsTopics, 
    storybookTopics, usecasesTopics, inspirationTopics, trendsTopics, 
    technologyTopics, nftTopics 
} from '../lib/constants';

const allTopicsByCategory: Record<string, string[]> = {
    'Featured': featuredTopics,
    'Prompts': promptsTopics,
    'Styles': stylesTopics,
    'Tutorials': tutorialsTopics,
    'Storybook': storybookTopics,
    'Usecases': usecasesTopics,
    'Inspiration': inspirationTopics,
    'Trends': trendsTopics,
    'Technology': technologyTopics,
    'NFT': nftTopics,
};

async function generateAndSaveForCategory(category: string, topics: string[]) {
    console.log(`--- Generating articles for category: ${category} ---`);
    
    // forceFetch: true ensures we read directly from the source, bypassing any in-memory cache.
    const currentArticles = await getArticles(category, true);

    // If there are already articles, don't generate more in this initial script.
    // The daily cron will handle updates. This prevents duplicating content on every run.
    if (currentArticles.length > 0) {
        console.log(`  -> Category "${category}" already has ${currentArticles.length} articles. Skipping initial generation.`);
        return;
    }

    let newArticles = [];

    // We generate 4 articles for each category as per the requirement
    const topicsToGenerate = topics.slice(0, 4);

    for (const topic of topicsToGenerate) {
        try {
            const article = await generateSingleArticle(topic, category);
            if (article) {
                newArticles.push(article);
                console.log(`  ✔ Successfully generated article for topic: "${topic}"`);
            } else {
                console.log(`  ✖ Failed to generate article for topic: "${topic}"`);
            }
        } catch (error) {
            console.error(`  ✖ An error occurred while generating article for topic: "${topic}"`, error);
        }
    }

    if (newArticles.length > 0) {
        // Since there were no current articles, the updated list is just the new ones.
        const updatedArticles = newArticles;
        await saveArticlesForCategory(category, updatedArticles);
        console.log(`  -> Saved ${updatedArticles.length} new articles for ${category}.`);
    } else {
        console.warn(`No new articles were generated for ${category}, nothing to save.`);
    }
    console.log(`--- Finished category: ${category} ---`);
}


async function main() {
    console.log('Starting one-time generation for all article categories...');
    
    // Validate that environment variables are loaded
    if (!process.env.OPENROUTER_API_KEY || !process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO_OWNER || !process.env.GITHUB_REPO_NAME) {
        console.error("ERROR: Required environment variables (OPENROUTER_API_KEY, GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME) are not defined in your .env file.");
        console.error("Please create a .env file in the root directory and add your keys.");
        process.exit(1);
    }

    // Using Promise.all to run category generation in parallel for speed
    const allPromises = Object.keys(allTopicsByCategory).map(category => 
        generateAndSaveForCategory(category, allTopicsByCategory[category])
    );

    await Promise.all(allPromises);

    console.log('Finished generating all articles.');
}

main().catch(e => {
    console.error('A critical error occurred during the article generation script:', e);
    process.exit(1);
});
