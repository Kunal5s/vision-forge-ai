
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs';

export default async function AdminPage() {
    // This page is a gateway that redirects to the dashboard or sign-in.
    // The middleware ensures only authenticated users reach this point.
    const { userId } = auth();

    if (userId) {
        redirect('/admin/dashboard');
    } else {
        redirect('/sign-in');
    }
}
