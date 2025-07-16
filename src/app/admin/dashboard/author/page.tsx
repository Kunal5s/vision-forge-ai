
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuthorData, saveAuthorData, AuthorSchema, type AuthorData } from './actions';
import Image from 'next/image';

type AuthorFormData = z.infer<typeof AuthorSchema>;

export default function ManageAuthorPage() {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<AuthorFormData>({
        resolver: zodResolver(AuthorSchema),
        defaultValues: {
            name: '',
            title: '',
            photoUrl: '',
            bio: ''
        },
    });

    const photoUrl = watch('photoUrl');

    useEffect(() => {
        // Load initial data
        getAuthorData().then(data => {
            setValue('name', data.name);
            setValue('title', data.title);
            setValue('photoUrl', data.photoUrl);
            setValue('bio', data.bio);
        });
    }, [setValue]);

    const onSubmit = async (data: AuthorFormData) => {
        setIsSaving(true);
        toast({ title: "Saving Author Info...", description: "Your changes are being updated." });

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
                <Button asChild variant="outline" size="sm">
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
                            <Label htmlFor="photoUrl">Photo URL</Label>
                            <Input id="photoUrl" {...register('photoUrl')} disabled={isSaving} placeholder="https://example.com/photo.png"/>
                            {errors.photoUrl && <p className="text-sm text-destructive mt-1">{errors.photoUrl.message}</p>}
                            {photoUrl && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
                                    <Image src={photoUrl} alt="Author preview" width={100} height={100} className="rounded-full border" />
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="bio">Author Bio</Label>
                            <Textarea
                                id="bio"
                                {...register('bio')}
                                disabled={isSaving}
                                rows={10}
                                placeholder="Write a detailed bio about the author (at least 500 words recommended)..."
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
