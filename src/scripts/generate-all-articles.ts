
// src/scripts/generate-all-articles.ts
import 'dotenv/config'; // Load environment variables from .env file
import { generateSingleArticle, saveArticlesForCategory } from '../lib/articles';
import { allTopicsByCategory } from '../lib/constants';
import { commitAndPushToGithub } from '../lib/github';

// This script is for a one-time, manual generation of all articles.
// The primary automatic mechanism is the CRON job defined in regenerate-two-categories.ts.
async function generateAndSaveForCategory(category: string, topics: string[]) {
    console.log(`--- Generating articles for category: ${category} ---`);
    
    // We are generating fresh articles, so no need to fetch current ones.
    let newArticles = [];
    const createdSlugs = new Set<string>();

    // Generate 4 articles per category
    const topicsToGenerate = topics.slice(0, 4);

    for (const topic of topicsToGenerate) {
        try {
            const article = await generateSingleArticle(topic, category);
            if (article) {
                // Ensure slug is unique within this generation batch
                if (!createdSlugs.has(article.slug)) {
                    newArticles.push(article);
                    createdSlugs.add(article.slug);
                    console.log(`  ✔ Successfully generated article for topic: "${topic}"`);
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
    
    const canCommit = process.env.GITHUB_TOKEN && process.env.GITHUB_REPO_OWNER && process.env.GITHUB_REPO_NAME;
    
    if (!process.env.OPENROUTER_API_KEY) {
        console.error("ERROR: Required environment variable OPENROUTER_API_KEY is not defined in your .env file.");
        console.error("Please create a .env file in the root directory and add your key.");
        process.exit(1);
    }
    
    if (!canCommit) {
        console.warn("WARNING: GitHub environment variables (GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME) are not set.");
        console.warn("Articles will be generated locally but will not be committed to GitHub.");
    }
    
    let filesChanged = false;
    for (const category in allTopicsByCategory) {
        const changed = await generateAndSaveForCategory(category, allTopicsByCategory[category]);
        if (changed) {
            filesChanged = true;
        }
    }
    
    if (filesChanged && canCommit) {
        // After all local files are saved, commit them to GitHub
        await commitAndPushToGithub('src/articles', 'feat: ✨ Regenerate AI articles for all categories');
    } else if (filesChanged && !canCommit) {
        console.log("Local articles generated. Skipping GitHub commit due to missing credentials.");
    }
     else {
        console.log("No new articles were generated across all categories. No GitHub commit needed.");
    }

    console.log('Finished generating all articles.');
}

main().catch(e => {
    console.error('A critical error occurred during the article generation script:', e);
    process.exit(1);
});
