
// src/scripts/generate-all-articles.ts
import 'dotenv/config'; // Load environment variables from .env file
import { generateAndSaveArticles } from '../lib/articles';
import { 
    featuredTopics, promptsTopics, stylesTopics, tutorialsTopics, 
    storybookTopics, usecasesTopics, inspirationTopics, trendsTopics, 
    technologyTopics, nftTopics 
} from '../lib/constants';

const allCategories = {
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

async function main() {
    console.log('Starting one-time generation for all article categories...');
    
    // Validate that environment variables are loaded
    if (!process.env.OPENROUTER_API_KEY) {
        console.error("ERROR: OPENROUTER_API_KEY is not defined in your .env file.");
        console.error("Please create a .env file in the root directory and add your API key.");
        process.exit(1);
    }
    
    const categoryPromises = Object.entries(allCategories).map(([category, topics]) => {
        return generateAndSaveArticles(category, topics).catch(e => {
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
