
// src/scripts/generate-all-articles.ts
import 'dotenv/config'; // Load environment variables from .env file
import { generateSingleArticle, saveArticlesForCategory, getArticles } from '../lib/articles';
import { allTopicsByCategory } from '../lib/constants';

async function generateAndSaveForCategory(category: string, topics: string[]) {
    console.log(`--- Generating articles for category: ${category} ---`);
    
    // forceFetch: true ensures we read directly from the source, bypassing any in-memory cache.
    const currentArticles = await getArticles(category, true);

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
        // Prepend the new articles to the existing ones
        const updatedArticles = [...newArticles, ...currentArticles];
        await saveArticlesForCategory(category, updatedArticles);
        console.log(`  -> Saved ${newArticles.length} new articles for ${category}. Total articles: ${updatedArticles.length}.`);
    } else {
        console.warn(`No new articles were generated for ${category}, nothing to save.`);
    }
    console.log(`--- Finished category: ${category} ---`);
}


async function main() {
    console.log('Starting one-time generation for all article categories...');
    
    if (!process.env.OPENROUTER_API_KEY) {
        console.error("ERROR: Required environment variable OPENROUTER_API_KEY is not defined in your .env file.");
        console.error("Please create a .env file in the root directory and add your key.");
        process.exit(1);
    }
    
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO_OWNER || !process.env.GITHUB_REPO_NAME) {
        console.warn("WARNING: GitHub environment variables (GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_TOKEN) are not fully set. Article persistence to GitHub will be disabled.");
    }

    // Sequentially generate categories to avoid overwhelming the API and to make logs easier to read.
    for (const category in allTopicsByCategory) {
        await generateAndSaveForCategory(category, allTopicsByCategory[category]);
    }

    console.log('Finished generating all articles.');
}

main().catch(e => {
    console.error('A critical error occurred during the article generation script:', e);
    process.exit(1);
});
