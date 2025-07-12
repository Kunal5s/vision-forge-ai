// src/scripts/regenerate-two-categories.ts
import 'dotenv/config';
import { generateSingleArticle, saveArticlesForCategory, getArticles } from '../lib/articles';
import { allTopicsByCategory } from '../lib/constants';
import { commitAndPushToGithub } from '../lib/github';

// Helper function to pick N random elements from an array
function pickRandom<T>(arr: T[], num: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

async function regenerateCategory(category: string, topics: string[]) {
    console.log(`--- Regenerating articles for category: ${category} ---`);
    
    let newArticles: Article[] = [];
    const createdSlugs = new Set<string>();

    const topicsToGenerate = topics.slice(0, 4); // Always take the first 4 defined topics for consistency

    for (const topic of topicsToGenerate) {
        try {
            const article = await generateSingleArticle(topic, category);
            if (article) {
                if (!createdSlugs.has(article.slug)) {
                    newArticles.push(article);
                    createdSlugs.add(article.slug);
                } else {
                    console.log(`  ! Skipped duplicate slug in batch: "${article.slug}"`);
                }
            } else {
                console.log(`  ✖ Generation failed for topic: "${topic}".`);
            }
        } catch (error) {
            console.error(`  ✖ An error occurred while generating article for topic: "${topic}"`, error);
        }
    }

    if (newArticles.length > 0) {
        // Overwrite the category file with the 4 newly generated articles
        await saveArticlesForCategory(category, newArticles);
        console.log(`  ✔ Successfully saved ${newArticles.length} new articles for ${category}.`);
        return true;
    } else {
        console.warn(`No new articles were successfully generated for ${category}.`);
        return false;
    }
}

async function main() {
    console.log('Starting scheduled regeneration for two categories...');
    
    const canCommit = process.env.GITHUB_TOKEN && process.env.GITHUB_REPO_OWNER && process.env.GITHUB_REPO_NAME;
    if (!canCommit || !process.env.OPENROUTER_API_KEY) {
        console.error("ERROR: Required environment variables are not set. Cannot run regeneration.");
        process.exit(1);
    }
    
    const allCategoryNames = Object.keys(allTopicsByCategory);
    const categoriesToUpdate = pickRandom(allCategoryNames, 2);
    
    console.log(`Selected categories for this run: ${categoriesToUpdate.join(', ')}`);

    let filesChanged = false;
    for (const category of categoriesToUpdate) {
        const changed = await regenerateCategory(category, allTopicsByCategory[category]);
        if (changed) {
            filesChanged = true;
        }
    }
    
    if (filesChanged) {
        await commitAndPushToGithub('src/articles', 'feat(cron): ✨ Regenerate AI articles for scheduled categories');
    } else {
        console.log("No new articles were generated. No GitHub commit needed.");
    }

    console.log('Finished scheduled regeneration.');
}

main().catch(e => {
    console.error('A critical error occurred during the scheduled article regeneration script:', e);
    process.exit(1);
});
