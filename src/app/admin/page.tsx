
import { redirect } from 'next/navigation';

export default async function AdminPage() {
    // This page is a gateway that redirects to the dashboard.
    // Protection logic is now simplified or can be managed via environment variables on the server.
    redirect('/admin/dashboard');
}
