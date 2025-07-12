
// src/scripts/regenerate-two-categories.ts
import 'dotenv/config';
import { generateAndSaveArticles } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { getContent, saveContent } from '@/lib/github';

// This script is specifically for the daily automated job (e.g., GitHub Actions)

const STATE_FILE_PATH = 'src/lib/regeneration-state.json';
const CATEGORIES_PER_RUN = 2; 
const CATEGORY_ROTATION = Object.keys(categorySlugMap).filter(slug => slug !== 'featured');

interface RegenerationState {
  lastUpdatedCategoryIndex: number;
}

async function getNextCategoriesForUpdate(): Promise<string[]> {
    let state: RegenerationState;
    try {
        const file = await getContent(STATE_FILE_PATH);
        if (file) {
            state = JSON.parse(file.content);
        } else {
            console.warn(`State file not found at ${STATE_FILE_PATH}. Starting from the beginning.`);
            state = { lastUpdatedCategoryIndex: -1 };
        }
    } catch (error) {
        console.warn(`Could not read state file, starting from scratch. Error: ${error}`);
        state = { lastUpdatedCategoryIndex: -1 };
    }

    const categoriesToUpdate: string[] = [];
    let currentIndex = state.lastUpdatedCategoryIndex;

    for (let i = 0; i < CATEGORIES_PER_RUN; i++) {
        currentIndex = (currentIndex + 1) % CATEGORY_ROTATION.length;
        const nextCategorySlug = CATEGORY_ROTATION[currentIndex];
        const nextCategoryName = categorySlugMap[nextCategorySlug];
        if (nextCategoryName) {
            categoriesToUpdate.push(nextCategoryName);
        }
    }
    
    const newState: RegenerationState = { lastUpdatedCategoryIndex: currentIndex };
    const stateFile = await getContent(STATE_FILE_PATH);
    await saveContent(
        STATE_FILE_PATH,
        JSON.stringify(newState, null, 2),
        `chore: update regeneration state to index ${currentIndex}`,
        stateFile?.sha
    );
    
    return categoriesToUpdate;
}

async function main() {
  try {
    console.log("Starting daily regeneration script...");
    const categoriesToUpdate = await getNextCategoriesForUpdate();
    
    if (categoriesToUpdate.length === 0) {
        console.log('No categories were scheduled for update.');
        return;
    }

    console.log(`Scheduled to regenerate articles for categories: "${categoriesToUpdate.join(', ')}".`);

    const generationPromises = categoriesToUpdate.map(category => 
        generateAndSaveArticles(category).catch(e => {
            console.error(`Failed to generate articles for category: ${category}`, e);
            return null; // Don't let one failure stop the whole process
        })
    );
    
    await Promise.all(generationPromises);
    
    console.log(`Successfully regenerated articles for: ${categoriesToUpdate.join(', ')}.`);
    console.log("Daily regeneration script finished.");

  } catch (error: any) {
    console.error('Daily regeneration script failed:', error);
    process.exit(1); // Exit with an error code to fail the GitHub Action
  }
}

main();
