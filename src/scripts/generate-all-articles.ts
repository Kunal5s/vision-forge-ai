
// src/scripts/generate-all-articles.ts
import 'dotenv/config'; // Load environment variables from .env file
import { generateAndSaveArticles } from '../lib/articles';
import { categorySlugMap } from '../lib/constants';

const allCategories = Object.values(categorySlugMap);

async function main() {
    console.log('Starting one-time generation for all article categories...');
    
    // Validate that environment variables are loaded
    if (!process.env.OPENROUTER_API_KEY) {
        console.error("ERROR: OPENROUTER_API_KEY is not defined in your .env file.");
        console.error("Please create a .env file in the root directory and add your API key.");
        process.exit(1);
    }
    
    // Set NODE_ENV to development to ensure files are saved locally
    process.env.NODE_ENV = 'development';

    const categoryPromises = allCategories.map((category) => {
        return generateAndSaveArticles(category).catch(e => {
            console.error(`An error occurred while generating articles for ${category}:`, e);
            return null; // Return null on failure to not stop other categories
        });
    });

    await Promise.all(categoryPromises);

    console.log('Finished generating all articles.');
}

main().catch(e => {
    console.error('A critical error occurred during the article generation script:', e);
    process.exit(1);
});
