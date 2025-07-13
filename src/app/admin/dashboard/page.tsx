// src/app/admin/dashboard/page.tsx
import { getUser, logout } from '@/app/admin/actions';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, PlusCircle, Edit, LogOut } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function AdminDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/admin');
  }

  const handleComingSoon = async () => {
    'use server';
    // This is a server action, so alert won't work directly.
    // In a real app, you'd handle this with a state update.
    // For now, we'll keep it simple as it's a placeholder.
    console.log("Feature coming soon!");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <header className="flex justify-between items-center mb-8">
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
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <PlusCircle className="text-primary" /> Create Article
                    </CardTitle>
                    <CardDescription>
                        Write a new article from scratch or generate one with AI assistance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleComingSoon}>
                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          Create New (Soon)
                      </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
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
                      <Button type="submit" variant="secondary" className="w-full">
                          Edit Existing (Soon)
                      </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
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
      <Footer />
    </div>
  );
}