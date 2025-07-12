
// src/scripts/generate-all-articles.ts
import 'dotenv/config'; // Load environment variables from .env file
import { generateSingleArticle, saveArticlesForCategory } from '../lib/articles';
import { allTopicsByCategory } from '../lib/constants';
import { commitAndPushToGithub } from '../lib/github';

async function generateAndSaveForCategory(category: string, topics: string[]) {
    console.log(`--- Generating articles for category: ${category} ---`);
    
    // We are generating fresh articles, so no need to fetch current ones.
    let newArticles = [];
    const createdSlugs = new Set<string>();

    const topicsToGenerate = topics.slice(0, 4);

    for (const topic of topicsToGenerate) {
        try {
            const article = await generateSingleArticle(topic, category);
            if (article) {
                // Ensure slug is unique within this generation batch
                if (!createdSlugs.has(article.slug)) {
                    newArticles.push(article);
                    createdSlugs.add(article.slug);
                } else {
                    console.log(`  ! Skipped duplicate slug: "${article.slug}"`);
                }
            } else {
                console.log(`  ✖ Skipped saving article for topic: "${topic}" due to generation failure.`);
            }
        } catch (error) {
            console.error(`  ✖ An error occurred while generating article for topic: "${topic}"`, error);
        }
    }

    if (newArticles.length > 0) {
        await saveArticlesForCategory(category, newArticles);
        console.log(`  -> Saved ${newArticles.length} new articles locally for ${category}.`);
        return true; // Indicate that files were changed
    } else {
        console.warn(`No new articles were successfully generated for ${category}, nothing to save.`);
        return false; // No files were changed
    }
}


async function main() {
    console.log('Starting one-time generation for all article categories...');
    
    if (!process.env.OPENROUTER_API_KEY) {
        console.error("ERROR: Required environment variable OPENROUTER_API_KEY is not defined in your .env file.");
        console.error("Please create a .env file in the root directory and add your key.");
        process.exit(1);
    }
    
    let filesChanged = false;
    for (const category in allTopicsByCategory) {
        const changed = await generateAndSaveForCategory(category, allTopicsByCategory[category]);
        if (changed) {
            filesChanged = true;
        }
    }
    
    if (filesChanged) {
        // After all local files are saved, commit them to GitHub
        await commitAndPushToGithub('src/articles', 'feat: ✨ Regenerate AI articles for all categories');
    } else {
        console.log("No new articles were generated across all categories. No GitHub commit needed.");
    }

    console.log('Finished generating all articles.');
}

main().catch(e => {
    console.error('A critical error occurred during the article generation script:', e);
    process.exit(1);
});
