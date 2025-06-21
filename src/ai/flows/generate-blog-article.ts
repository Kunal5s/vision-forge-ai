
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
    You are an expert blog writer and SEO specialist, a master of creating engaging, well-structured content about AI image generation.
    Your task is to write a comprehensive, insightful, and engaging blog post on the given topic. The output must be perfectly structured for SEO and readability.

    TOPIC: "{{topic}}"
    CATEGORY: "{{category}}"

    Follow these instructions with absolute precision:
    1.  **HTML Structure - NON-NEGOTIABLE**: The entire output must be valid HTML.
        -   Start DIRECTLY with an <h1> tag for the topic: \`<h1>{{topic}}</h1>\`. There must be NO text before this tag.
        -   Your article MUST have a clear hierarchical structure.
        -   Use at least three to four distinct \`<h2>\` tags for the main sections.
        -   Under each \`<h2>\` tag, you MUST include at least one or two \`<h3>\` tags for subsections.
        -   Use \`<h4>\`, \`<h5>\`, and \`<h6>\` for even deeper nesting where appropriate.
        -   Use \`<p>\` for paragraphs. Paragraphs should be clear and concise, typically 2-4 sentences long. Do not create long walls of text.
        -   Use \`<ul>\` or \`<ol>\` for lists, and \`<strong>\` or \`<em>\` for emphasis. Use \`<blockquote>\` for quotes.
    2.  **Article Length**: The article must be substantial and approximately 800 words long. This is a shorter length to ensure stability on serverless platforms.
    3.  **Content and Tone**:
        -   The content must be cutting-edge, reflecting the absolute latest trends in the "{{category}}" of AI image generation.
        -   Provide practical, actionable tips, detailed prompt examples, and deep insights that are valuable to both beginners and experts.
        -   The tone should be authoritative, engaging, and professional.
    4.  **Final Check**: Before finishing, ensure your response is ONLY the HTML content, starting with \`<h1>\` and ending with the final closing tag. No introductory or concluding remarks outside of the HTML.

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
       const errorContent = `<h1>Content Generation Failed</h1><p>We're sorry, but we were unable to generate this article. This can happen due to several reasons:</p><ul><li class="mb-2"><strong>High Server Load:</strong> The AI model may be temporarily busy. Please try again in a few moments.</li><li class="mb-2"><strong>Function Timeout:</strong> On hosting platforms like Netlify, long-running tasks like generating a full article can exceed the time limit for serverless functions, causing the process to be terminated. Reducing article complexity can help avoid this.</li><li class="mb-2"><strong>Configuration Issue:</strong> Please ensure your GOOGLE_API_KEY is correctly set in your deployment environment and that billing is enabled for your Google Cloud project.</li></ul>`;
       return { articleContent: errorContent };
    }
  }
);
