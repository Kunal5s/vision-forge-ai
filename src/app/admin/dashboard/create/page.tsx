// src/app/admin/dashboard/create/page.tsx
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { categorySlugMap } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { generateArticleAction } from './actions';

const articleSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function CreateArticlePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors } } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
  });

  const onSubmit: SubmitHandler<ArticleFormData> = async (data) => {
    setIsGenerating(true);
    toast({
      title: 'Starting AI Article Generation...',
      description: 'The AI is warming up. This might take a minute or two.',
    });

    const result = await generateArticleAction(data);

    if (result.success) {
      toast({
        title: 'Article Generated Successfully!',
        description: `New article "${result.title}" has been created and saved.`,
      });
    } else {
      toast({
        title: 'Error Generating Article',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsGenerating(false);
  };

  return (
    <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
      <div className="mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Article</CardTitle>
          <CardDescription>
            Fill in the details below. You can either write the content manually or use our powerful AI to generate it for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Article Title</Label>
              <Input
                id="title"
                placeholder="e.g., The Ultimate Guide to AI-Powered Photography"
                {...register('title')}
                disabled={isGenerating}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categorySlugMap).map(([slug, name]) => (
                        <SelectItem key={slug} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
            </div>

            <div className="border-t pt-6 space-y-4">
               <h3 className="text-lg font-semibold">Actions</h3>
               <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Article with AI
                  </>
                )}
              </Button>
               <Button type="button" variant="secondary" className="w-full" disabled={true}>
                  Save Manually (Coming Soon)
               </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
