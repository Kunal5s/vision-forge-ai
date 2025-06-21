'use server';

/**
 * @fileOverview An AI flow for generating high-quality, long-form blog articles.
 *
 * - generateBlogArticle - A function that generates a blog post based on a topic and category.
 * - GenerateBlogArticleInput - The input type for the generateBlogArticle function.
 * - GenerateBlogArticleOutput - The return type for the generateBlogArticle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBlogArticleInputSchema = z.object({
  topic: z.string().describe('The main topic or title of the blog post.'),
  category: z.string().describe('The category of the blog post, used for context.'),
});
export type GenerateBlogArticleInput = z.infer<typeof GenerateBlogArticleInputSchema>;

const GenerateBlogArticleOutputSchema = z.object({
  articleContent: z.string().describe('The full, HTML-formatted blog article.'),
});
export type GenerateBlogArticleOutput = z.infer<typeof GenerateBlogArticleOutputSchema>;

export async function generateBlogArticle(input: GenerateBlogArticleInput): Promise<GenerateBlogArticleOutput> {
  return generateBlogArticleFlow(input);
}

const blogWriterPrompt = ai.definePrompt({
  name: 'blogWriterPrompt',
  input: { schema: GenerateBlogArticleInputSchema },
  output: { schema: GenerateBlogArticleOutputSchema },
  prompt: `
    You are an expert blog writer and journalist specializing in AI image generation technology and digital art.
    Your task is to write a comprehensive, insightful, and engaging blog post on a given topic.

    TOPIC: "{{topic}}"
    CATEGORY: "{{category}}"

    Follow these instructions precisely:
    1.  **Article Length**: The article must be detailed and approximately 1700 words long.
    2.  **HTML Structure**: The entire output must be valid HTML.
        -   Start DIRECTLY with an <h1> tag for the topic: \`<h1>{{topic}}</h1>\`. Do not add any text before this tag.
        -   Structure the article with proper semantic HTML. Use <h2> for major sections, <h3> for sub-sections, and <h4>, <h5>, <h6> for deeper subheadings.
        -   Use <p> for paragraphs, <ul> or <ol> for lists, and <strong> or <em> for emphasis. Use <blockquote> for quotes.
    3.  **Content and Tone**:
        -   The content must be up-to-date, reflecting the latest trends in the "{{category}}" of AI image generation.
        -   The tone should be authoritative, insightful, and inspiring for both beginners and advanced users.
        -   Provide practical tips, prompt examples, and deep insights.
    4.  **No Preamble**: Do not write any introduction or text before the initial \`<h1>\` tag. Your response should be the article content itself.

    Begin writing the article now.
  `,
  config: {
    // Increase temperature for more creative and less repetitive writing in long-form content.
    temperature: 0.7, 
  }
});


const generateBlogArticleFlow = ai.defineFlow(
  {
    name: 'generateBlogArticleFlow',
    inputSchema: GenerateBlogArticleInputSchema,
    outputSchema: GenerateBlogArticleOutputSchema,
  },
  async (input) => {
    if (!process.env.GOOGLE_API_KEY) {
      const errorContent = `<h1>Configuration Error</h1><p>The GOOGLE_API_KEY is not set up correctly. Please check your deployment environment variables. This is required to generate blog content.</p>`;
      return { articleContent: errorContent };
    }
    
    try {
      const { output } = await blogWriterPrompt(input);
      if (!output?.articleContent) {
        throw new Error("The AI model did not return any content.");
      }
      return { articleContent: output.articleContent };
    } catch (e: any) {
       console.error("Error generating blog article:", e);
       const errorContent = `<h1>Content Generation Failed</h1><p>We're sorry, but we were unable to generate this article at the moment. This can happen due to high server load or a temporary issue with the AI model. Please try again in a few moments.</p><p>If the problem persists, it might be related to the complexity of the topic or a configuration issue.</p>`;
       return { articleContent: errorContent };
    }
  }
);
