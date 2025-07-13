// src/app/admin/dashboard/page.tsx
"use client";

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, PlusCircle, Edit, LogOut } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AdminDashboardPage() {
  const { isAuthenticated, user, logout } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect runs on the client. If not authenticated, redirect to login.
    if (!isAuthenticated) {
      router.replace('/admin');
    }
  }, [isAuthenticated, router]);

  // While checking auth, you can show a loader or nothing
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };

  const handleComingSoon = () => {
    alert('This feature is coming soon!');
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
            <Button onClick={handleLogout} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
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
                    <Button onClick={handleComingSoon} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Create New
                    </Button>
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
                     <Button onClick={handleComingSoon} variant="secondary" className="w-full">
                        Edit Existing
                    </Button>
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
                    <Button onClick={handleComingSoon} variant="outline" className="w-full" disabled>
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