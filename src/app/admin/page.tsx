
// src/app/admin/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
    // This page is now just a gateway.
    // If the user is logged in, they will be sent to the dashboard.
    // If not, the middleware will catch them and redirect to sign-in.
    // So, we just redirect to the dashboard from here.
    const { userId } = auth();

    if (userId) {
        redirect('/admin/dashboard');
    } else {
        // The middleware will handle this, but as a fallback:
        redirect('/sign-in');
    }
}
