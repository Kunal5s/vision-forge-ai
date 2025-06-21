
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
    You are an expert SEO content writer. Your task is to generate a comprehensive, well-structured, and engaging blog article.

    The topic is: "{{topic}}"
    The category is: "{{category}}"

    You MUST follow these rules without exception:
    1. The ENTIRE output MUST be valid HTML. Do not include any text before the first HTML tag or after the last one.
    2. The article MUST start with an <h1> tag containing the topic.
    3. The article MUST have a clear hierarchical structure using <h2>, <h3>, <h4>, <h5>, and <h6> tags.
    4. There MUST be at least three <h2> sections.
    5. Each <h2> section MUST contain at least two <h3> subsections.
    6. Use <h4>, <h5>, and <h6> tags for deeper nesting where appropriate.
    7. All text content MUST be enclosed in <p> tags. Paragraphs should be 2-4 sentences long.
    8. Use <strong>, <em>, and <ul> with <li> for lists to enhance readability.

    Begin writing the HTML now.
  `,
  config: {
    temperature: 0.8,
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
