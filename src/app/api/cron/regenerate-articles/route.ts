
// src/app/api/cron/regenerate-articles/route.ts
import { NextResponse } from 'next/server';
import 'dotenv/config';
import { generateAndSaveArticles } from '@/lib/articles';
import { categorySlugMap } from '@/lib/constants';
import { getContent, saveContent } from '@/lib/github';

// This is the API route that the GitHub Actions CRON job will call.
// It is protected by a secret to prevent unauthorized access.

const STATE_FILE_PATH = 'src/lib/regeneration-state.json';

interface RegenerationState {
    lastProcessedIndex: number;
}

// Main function to be executed by the CRON job
export async function GET(request: Request) {
    // 1. Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Determine which category to process next
        const categories = Object.values(categorySlugMap);
        let state: RegenerationState = { lastProcessedIndex: -1 };

        const stateFile = await getContent(STATE_FILE_PATH);
        if (stateFile) {
            try {
                state = JSON.parse(stateFile.content);
            } catch (e) {
                console.error("Could not parse regeneration state, starting from scratch.", e);
            }
        }
        
        const nextIndex = (state.lastProcessedIndex + 1) % categories.length;
        const categoryToProcess = categories[nextIndex];
        
        console.log(`CRON job triggered. Processing category: "${categoryToProcess}" (Index: ${nextIndex})`);

        // 3. Generate one new article for that category
        // We generate only one to keep the CRON job fast and reliable.
        await generateAndSaveArticles(categoryToProcess, 1);

        // 4. Update and save the state for the next run
        const newState: RegenerationState = { lastProcessedIndex: nextIndex };
        await saveContent(
            STATE_FILE_PATH,
            JSON.stringify(newState, null, 2),
            `chore: update regeneration state to index ${nextIndex}`,
            stateFile?.sha
        );
        
        console.log(`Successfully processed category "${categoryToProcess}". State updated.`);
        return NextResponse.json({ success: true, processedCategory: categoryToProcess });

    } catch (error: any) {
        console.error('[CRON_HANDLER_ERROR]', error);
        return NextResponse.json({ error: 'Failed to regenerate articles', details: error.message }, { status: 500 });
    }
}
