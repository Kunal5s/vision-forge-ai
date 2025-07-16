
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export default function CreateWebStoryPage() {

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
                    <CardTitle className="text-2xl">Create a New Web Story</CardTitle>
                    <CardDescription>
                        This feature is under construction. Soon you will be able to build engaging web stories right here.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                    <Construction className="mx-auto h-24 w-24 text-muted-foreground/50" />
                    <p className="mt-4 text-lg text-muted-foreground">Coming Soon!</p>
                </CardContent>
            </Card>
        </main>
    );
}
