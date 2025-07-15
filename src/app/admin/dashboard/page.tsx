// src/app/admin/dashboard/page.tsx
import { getUser, logout } from '@/app/admin/actions';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, PlusCircle, Edit, LogOut, FileSignature } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/admin');
  }

  const handleComingSoon = async () => {
    'use server';
    // This action is a placeholder for features that are not yet implemented.
    // In a real app, this might show a toast or log analytics.
    console.log("Feature coming soon!");
  };

  return (
    <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
      <header className="flex justify-between items-center mb-10">
          <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                  Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Welcome back, {user?.email}!</p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
          </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/admin/dashboard/create" className="block h-full transition-all hover:shadow-lg hover:-translate-y-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <PlusCircle className="text-primary" /> Create with AI
                  </CardTitle>
                  <CardDescription>
                      Generate a new SEO-friendly article with AI assistance.
                  </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Generate Article
                  </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/manual" className="block h-full transition-all hover:shadow-lg hover:-translate-y-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <FileSignature className="text-green-600" /> Manual Publish
                  </CardTitle>
                  <CardDescription>
                      Write, format, and publish your own articles from scratch.
                  </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button className="w-full" variant="outline">
                    Write Manually
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/edit" className="block h-full transition-all hover:shadow-lg hover:-translate-y-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <Edit className="text-accent" /> Manage Articles
                  </CardTitle>
                  <CardDescription>
                      Find, modify, and manage all previously published articles.
                  </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button variant="secondary" className="w-full">
                    Manage Content
                </Button>
              </CardContent>
            </Card>
          </Link>

      </div>
    </main>
  );
}
