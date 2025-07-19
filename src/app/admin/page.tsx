
import { redirect } from 'next/navigation';

export default async function AdminPage() {
    // This page is a gateway that redirects to the dashboard.
    // The middleware will handle authentication checks.
    redirect('/admin/dashboard');
}
