
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Upload } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuthorData, saveAuthorData } from './actions';
import type { AuthorData } from '@/lib/author';
import Image from 'next/image';
import { RichTextEditor } from '@/components/vision-forge/RichTextEditor';
import { useRouter } from 'next/navigation';

// The schema now validates for a standard URL for the photo.
const AuthorFormSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    title: z.string().min(1, 'Title is required.'),
    photoUrl: z.string().url('A valid photo URL is required. Data URIs are not supported.'),
    bio: z.string().min(50, 'Bio must be at least 50 characters long.'),
});

type AuthorFormData = z.infer<typeof AuthorFormSchema>;

export default function ManageAuthorPage() {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<AuthorFormData>({
        resolver: zodResolver(AuthorFormSchema),
        defaultValues: {
            name: '',
            title: '',
            photoUrl: '',
            bio: ''
        },
    });

    const photoUrl = watch('photoUrl');

    useEffect(() => {
        getAuthorData().then(data => {
            reset(data); // Use reset to update all form values and form state
        });
    }, [reset]);
    
    // When a file is selected, we now set a standard placeholder URL instead of a data URI.
    // This prevents the JSON file from becoming too large and causing deployment issues.
    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid File Type", description: "Please upload a valid image file (PNG, JPG).", variant: "destructive" });
                return;
            }
            // Use FileReader to create a temporary URL for preview, but don't save the Data URI to the form state.
            const reader = new FileReader();
            reader.onload = (e) => {
                // This will show a preview of the image, but the actual URL saved to JSON will be a placeholder.
                // For a full implementation, this should upload to a service like Firebase Storage or Vercel Blob
                // and then set the returned URL. For now, we'll just show the preview and set a placeholder URL.
                setValue('photoUrl', e.target?.result as string, { shouldDirty: true, shouldValidate: true });
            };
            reader.readAsDataURL(file);
            toast({ title: "Photo Updated", description: "A preview has been generated. The actual image is not uploaded to a server in this demo.", variant: 'default' });
        }
    }, [setValue, toast]);

    const onSubmit = async (data: AuthorFormData) => {
        setIsSaving(true);
        toast({ title: "Saving Author Info...", description: "Your changes are being updated." });

        // If the photoUrl is a data URI, replace it with a placeholder before saving to prevent large JSON files.
        if (data.photoUrl.startsWith('data:image')) {
            data.photoUrl = 'https://placehold.co/100x100.png';
        }

        const result = await saveAuthorData(data);

        if (result.success) {
            toast({ title: "Successfully Saved!", description: "Your author information has been updated." });
        } else {
            toast({ title: "Error", description: result.error || "Failed to save author information.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
            <div className="mb-8">
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href="/admin/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
                </Button>
            </div>
            
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Manage Author Information</CardTitle>
                    <CardDescription>Update your public author photo, name, title, and bio here. These will be shown on article pages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Author Name</Label>
                                <Input id="name" {...register('name')} disabled={isSaving} />
                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="title">Author Title / Role</Label>
                                <Input id="title" {...register('title')} disabled={isSaving} placeholder="e.g., AI & Tech Expert" />
                                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                            </div>
                        </div>

                        <div>
                            <Label>Author Photo</Label>
                             <div className="mt-2 flex items-center gap-4">
                                {photoUrl && (
                                     <Image src={photoUrl} alt="Author preview" width={100} height={100} className="rounded-full border object-cover aspect-square" />
                                )}
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Change Photo
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                />
                             </div>
                             <p className="text-xs text-muted-foreground mt-2">Recommended size: 100x100 pixels. A PNG or JPG file is required.</p>
                             {errors.photoUrl && <p className="text-sm text-destructive mt-1">{errors.photoUrl.message}</p>}
                        </div>


                        <div>
                            <Label htmlFor="bio">Author Bio</Label>
                            <Controller
                                name="bio"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isSaving}
                                        placeholder="Write a detailed bio about the author..."
                                    />
                                )}
                            />
                            {errors.bio && <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>}
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
