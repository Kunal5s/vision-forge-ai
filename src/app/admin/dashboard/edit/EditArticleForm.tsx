
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Trash2, Bold, Italic, Heading2, Link as LinkIcon, List, ListOrdered, Quote as QuoteIcon, Image as ImageIcon } from 'lucide-react';
import { useState, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/articles';
import { editArticleAction, deleteArticleAction } from '../../../create/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const editSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required."),
  content: z.string(), 
});

type EditFormData = z.infer<typeof editSchema>;

interface EditArticleFormProps {
    article: Article;
    categoryName: string;
}

const contentToMarkdown = (content: Article['articleContent']): string => {
    return content.map(block => {
        switch (block.type) {
            case 'h1': return `# ${block.content}`;
            case 'h2': return `## ${block.content}`;
            case 'h3': return `### ${block.content}`;
            case 'h4': return `#### ${block.content}`;
            case 'h5': return `##### ${block.content}`;
            case 'h6': return `###### ${block.content}`;
            case 'p': return block.content;
            case 'img': return `![${block.alt || ''}](${block.content})`;
            default: return block.content;
        }
    }).join('\n\n'); 
}

export default function EditArticleForm({ article, categoryName }: EditArticleFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: article.title,
      slug: article.slug,
      content: contentToMarkdown(article.articleContent),
    }
  });

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = `${text.substring(0, start)}${before}${selectedText}${after}${text.substring(end)}`;
    setValue('content', newText, { shouldValidate: true, shouldDirty: true });
    
    // Focus and set cursor position
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      toast({ title: "Uploading image...", description: "Please wait." });
      // In a real app, you would upload to a service (like Firebase Storage)
      // and get a URL back. For this demo, we'll use a placeholder.
      // Simulating upload delay
      await new Promise(res => setTimeout(res, 1000));
      const imageUrl = `https://placehold.co/800x400.png`; // Replace with actual uploaded URL
      
      insertText(`\n\n![${file.name}](${imageUrl})\n\n`);
      toast({ title: "Image Inserted!", description: "A placeholder image has been added to your content."});
  };

  const onSubmit = async (data: EditFormData) => {
    setIsSaving(true);
    toast({ title: "Saving...", description: "Updating your article." });

    const result = await editArticleAction({
      ...data,
      originalSlug: article.slug,
      category: categoryName
    });

    if (result?.error) {
      toast({ title: "Error Saving", description: result.error, variant: 'destructive' });
    } else {
      toast({ title: "Article Saved!", description: `"${data.title}" has been updated.` });
    }
    setIsSaving(false);
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    toast({ title: "Deleting...", description: `Removing article "${article.title}".` });
    
    const result = await deleteArticleAction(categoryName, article.slug);
    
     if (result?.error) {
      toast({ title: "Error Deleting", description: result.error, variant: 'destructive' });
      setIsDeleting(false);
    } else {
      toast({ title: "Article Deleted", description: "The article has been successfully removed." });
    }
  }

  const { ref: formRef, ...rest } = register('content');

  return (
    <>
      <div className="mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/dashboard/edit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Articles
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Article</CardTitle>
          <CardDescription>
            Make changes to your article below. Use the toolbar or Markdown syntax for formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...register('title')} disabled={isSaving || isDeleting} />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" {...register('slug')} disabled={isSaving || isDeleting} />
                  {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                </div>
            </div>

            <div>
              <Label htmlFor="content">Content (Markdown Supported)</Label>
              <div className="border rounded-md mt-2">
                <div className="p-2 border-b bg-muted/50 flex flex-wrap items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => insertText("## ")} title="Heading 2"><Heading2 className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => insertText("**", "**")} title="Bold"><Bold className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => insertText("*", "*")} title="Italic"><Italic className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => insertText("[", "](url)")} title="Link"><LinkIcon className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => insertText("\n- ", "")} title="Bullet List"><List className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => insertText("\n1. ", "")} title="Numbered List"><ListOrdered className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => insertText("\n> ", "")} title="Blockquote"><QuoteIcon className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload Image"><ImageIcon className="h-4 w-4" /></Button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
                <Textarea
                  id="content"
                  {...rest}
                  ref={(e) => {
                    formRef(e);
                    // @ts-ignore
                    textareaRef.current = e;
                  }}
                  rows={20}
                  className="font-mono border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="## Your Heading&#10;&#10;Your paragraph content..."
                  disabled={isSaving || isDeleting}
                />
              </div>
               {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
            </div>

            <div className="border-t pt-6 flex justify-between items-center">
              <Button type="submit" disabled={isSaving || isDeleting}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button type="button" variant="destructive" disabled={isSaving || isDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Article
                   </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the article from your GitHub repository.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                           {isDeleting ? 'Deleting...' : 'Yes, delete it'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
