
import 'dotenv/config';
import { generateAndSaveArticles } from '@/lib/articles';
import { allTopicsByCategory } from '@/lib/constants';

async function generateAll() {
  console.log("Starting master script to generate articles for ALL categories...");

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("FATAL ERROR: OPENROUTER_API_KEY is not set in the .env file.");
    return;
  }
   if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO_OWNER || !process.env.GITHUB_REPO_NAME) {
    console.warn("WARNING: GitHub credentials are not set. Articles will be saved locally but not committed to the repository.");
  }


  const categories = Object.keys(allTopicsByCategory);

  for (const category of categories) {
    const topics = allTopicsByCategory[category];
    // This will generate 4 articles for each category
    await generateAndSaveArticles(category, topics);
  }

  console.log("Master script finished. All categories have been processed.");
}

generateAll().catch(error => {
  console.error("An unexpected error occurred during article generation:", error);
});

    