
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
    2.  **Article Length**: The article must be substantial and approximately 500 words long. This is a shorter length to ensure stability on serverless platforms.
    3.  **Content and Tone**:
        -   The content must be cutting-edge, reflecting the absolute latest trends in the "{{category}}" of AI image generation.
        -   Provide practical, actionable tips, detailed prompt examples, and deep insights that are valuable to both beginners and experts.
        -   The tone should be authoritative, engaging, and professional.
    4.  **Final Check**: Before finishing, ensure your response is ONLY the HTML content, starting with \`<h1>\` and ending with the final closing tag. No introductory or concluding remarks outside of the HTML.

    Begin writing the article now.
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
  async (input) => {
    // --- TEMPORARY DEBUGGING STEP ---
    // Return placeholder content to ensure the Netlify build passes.
    // This removes the heavy AI call that is likely causing the build to time out.
    console.log(`Bypassing AI for topic: ${input.topic} to ensure successful deployment.`);
    const placeholderContent = `<h1>${input.topic}</h1>
      <h2>Deployment Successful!</h2>
      <p>This is placeholder content. It confirms that the website update was deployed successfully to Netlify.</p>
      <p>The live AI article generation was temporarily disabled to resolve the build failure. We will now proceed with safely re-enabling it.</p>
      <p>Thank you for your patience.</p>`;
    return { articleContent: placeholderContent };
    // --- END TEMPORARY STEP ---
  }
);
