// src/app/admin/page.tsx
import { getUser } from '@/app/admin/actions';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default async function AdminPage() {
    const user = await getUser();

    // If user is already logged in, redirect them to the dashboard.
    if (user) {
        redirect('/admin/dashboard');
    }

    // If user is not logged in, redirect to home and show a message (conceptually).
    // In a real app, you might show this message on the homepage via a query param.
    // For now, this redirect is sufficient as the login is in the header.
    redirect('/');

    // This part will not be rendered due to the redirects, but is here for clarity.
    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Redirecting...</AlertTitle>
                <AlertDescription>
                    Please use the 'Admin Login' button in the header to access the admin panel.
                </AlertDescription>
            </Alert>
        </main>
    );
}
