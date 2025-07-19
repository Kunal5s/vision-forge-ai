// src/app/admin/page.tsx
import { redirect } from 'next/navigation';

export default async function AdminPage() {
    // This page is a gateway that redirects to the dashboard.
    // In a real app, you might have a login form here.
    redirect('/admin/dashboard');
}