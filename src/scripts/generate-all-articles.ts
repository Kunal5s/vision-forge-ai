
// src/scripts/generate-all-articles.ts
import 'dotenv/config'; // Load environment variables from .env file
import { generateSingleArticle, saveArticlesForCategory, getArticles } from '../lib/articles';
import { allTopicsByCategory } from '../lib/constants';

async function generateAndSaveForCategory(category: string, topics: string[]) {
    console.log(`--- Generating articles for category: ${category} ---`);
    
    const currentArticles = await getArticles(category, true);

    let newArticles = [];

    const topicsToGenerate = topics.slice(0, 4);

    for (const topic of topicsToGenerate) {
        try {
            const article = await generateSingleArticle(topic, category);
            if (article) {
                newArticles.push(article);
            } else {
                console.log(`  ✖ Skipped saving article for topic: "${topic}" due to generation failure.`);
            }
        } catch (error) {
            console.error(`  ✖ An error occurred while generating article for topic: "${topic}"`, error);
        }
    }

    if (newArticles.length > 0) {
        const updatedArticles = [...newArticles, ...currentArticles];
        await saveArticlesForCategory(category, updatedArticles);
        console.log(`  -> Saved ${newArticles.length} new articles for ${category}. Total articles: ${updatedArticles.length}.`);
    } else {
        console.warn(`No new articles were successfully generated for ${category}, nothing to save.`);
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
    
    for (const category in allTopicsByCategory) {
        await generateAndSaveForCategory(category, allTopicsByCategory[category]);
    }

    console.log('Finished generating all articles.');
}

main().catch(e => {
    console.error('A critical error occurred during the article generation script:', e);
    process.exit(1);
});
