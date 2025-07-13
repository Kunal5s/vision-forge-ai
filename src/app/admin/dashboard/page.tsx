// src/app/admin/dashboard/page.tsx
import { getUser, logout } from '@/app/admin/actions';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, PlusCircle, Edit, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/admin');
  }

  const handleComingSoon = async () => {
    'use server';
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
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all">
            <Link href="/admin/dashboard/create" className="block h-full">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <PlusCircle className="text-primary" /> Create Article
                  </CardTitle>
                  <CardDescription>
                      Write a new article from scratch or generate one with AI assistance.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Create New
                  </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <Edit className="text-accent" /> Edit Article
                  </CardTitle>
                  <CardDescription>
                      Find and modify previously published articles.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <form action={handleComingSoon}>
                    <Button type="submit" variant="secondary" className="w-full" disabled>
                        Edit Existing (Soon)
                    </Button>
                  </form>
              </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <LayoutDashboard className="text-muted-foreground" /> Manage Site
                  </CardTitle>
                  <CardDescription>
                      Access other site management tools and settings. (Coming soon)
                  </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                    Site Settings
                </Button>
              </CardContent>
          </Card>
      </div>
    </main>
  );
}
