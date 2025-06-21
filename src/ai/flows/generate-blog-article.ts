
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
  error: z.string().optional().describe('An error message if generation failed.'),
});
export type GenerateBlogArticleOutput = z.infer<typeof GenerateBlogArticleOutputSchema>;

export async function generateBlogArticle(input: GenerateBlogArticleInput): Promise<GenerateBlogArticleOutput> {
  return generateBlogArticleFlow(input);
}

const blogWriterPrompt = ai.definePrompt({
  name: 'blogWriterPrompt',
  input: { schema: GenerateBlogArticleInputSchema },
  output: { schema: z.object({ articleContent: z.string() }) },
  prompt: `
    You are an expert blog writer and SEO specialist.
    Your task is to write a comprehensive, engaging blog post about AI image generation, approximately 500 words long.

    TOPIC: "{{topic}}"
    CATEGORY: "{{category}}"

    The entire output must be valid HTML:
    - Start DIRECTLY with an <h1> tag for the topic.
    - Use at least three to four distinct <h2> tags for main sections.
    - Under each <h2>, include one or two <h3> tags for subsections.
    - Use <p> for paragraphs (2-4 sentences long).
    - Use <strong>, <em>, and <ul> for emphasis and lists.

    Begin writing.
  `,
  config: {
    temperature: 0.7,
  }
});


const generateBlogArticleFlow = ai.defineFlow(
  {
    name: 'generateBlogArticleFlow',
    inputSchema: GenerateBlogArticleInputSchema,
    outputSchema: GenerateBlogArticleOutputSchema,
  },
  async (input): Promise<GenerateBlogArticleOutput> => {
    if (!process.env.GOOGLE_API_KEY) {
      const errorMsg = "Your GOOGLE_API_KEY is not set correctly. Please check your Netlify environment variables.";
      console.error(errorMsg);
      return {
        articleContent: `<h1>Configuration Error</h1><p>${errorMsg}</p>`,
        error: errorMsg
      };
    }

    try {
      const { output } = await blogWriterPrompt(input);
      if (!output?.articleContent) {
        const failureReason = "The AI could not generate the article. This might be due to a temporary issue with the AI service or a problem with your prompt. Please try again.";
        return {
            articleContent: `<h1>Generation Failed</h1><p>${failureReason}</p>`,
            error: failureReason
        };
      }
      return { articleContent: output.articleContent };

    } catch (e: any) {
      console.error("Blog article generation failed:", e);
      const detailedMessage = "An unexpected server error occurred during article generation. This can be caused by server timeouts on free hosting plans or issues with the underlying AI service. Please try refreshing the page.";
      return {
        articleContent: `<h1>Server Error</h1><p>${detailedMessage}</p>`,
        error: detailedMessage
      };
    }
  }
);
