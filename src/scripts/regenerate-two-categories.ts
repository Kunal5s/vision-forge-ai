
import 'dotenv/config';
import { generateAndSaveArticles } from '@/lib/articles';
import { allTopicsByCategory } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

const STATE_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'regeneration-state.json');

interface RegenerationState {
    lastProcessedIndex: number;
}

async function readState(): Promise<RegenerationState> {
    try {
        await fs.access(STATE_FILE_PATH);
        const data = await fs.readFile(STATE_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is invalid, start from the beginning
        return { lastProcessedIndex: -1 };
    }
}

async function writeState(state: RegenerationState): Promise<void> {
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

function selectTwoCategories(lastIndex: number, totalCategories: number): number[] {
    const indices: number[] = [];
    let nextIndex1 = (lastIndex + 1) % totalCategories;
    indices.push(nextIndex1);

    let nextIndex2 = (nextIndex1 + 1) % totalCategories;
    indices.push(nextIndex2);
    
    return indices;
}


async function regenerate() {
    console.log("Starting automatic regeneration process...");

    if (!process.env.OPENROUTER_API_KEY) {
        console.error("FATAL ERROR: OPENROUTER_API_KEY is not set. Aborting regeneration.");
        return;
    }
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO_OWNER || !process.env.GITHUB_REPO_NAME) {
        console.error("FATAL ERROR: GitHub credentials are not set. Aborting regeneration as articles cannot be saved.");
        return;
    }

    const state = await readState();
    const categories = Object.keys(allTopicsByCategory);
    
    if (categories.length === 0) {
        console.log("No categories found to process.");
        return;
    }

    const categoryIndicesToProcess = selectTwoCategories(state.lastProcessedIndex, categories.length);
    
    const category1Name = categories[categoryIndicesToProcess[0]];
    const category2Name = categories[categoryIndicesToProcess[1]];

    console.log(`Selected categories for regeneration: "${category1Name}" and "${category2Name}"`);

    const topics1 = allTopicsByCategory[category1Name];
    const topics2 = allTopicsByCategory[category2Name];

    await generateAndSaveArticles(category1Name, topics1);
    await generateAndSaveArticles(category2Name, topics2);

    // Update state to the last processed index
    const newLastIndex = categoryIndicesToProcess[1];
    await writeState({ lastProcessedIndex: newLastIndex });

    console.log(`Automatic regeneration process finished. Last processed index is now ${newLastIndex}.`);
}

regenerate().catch(error => {
    console.error("An error occurred during the regeneration process:", error);
});

    