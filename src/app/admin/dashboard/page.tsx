

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, FileSignature, BookImage, UserCircle, History } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {

  return (
    <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-10 gap-4">
          <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Welcome back, Admin!</p>
          </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/admin/dashboard/create" className="block h-full">
            <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
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

          <Link href="/admin/dashboard/manual" className="block h-full">
            <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
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

           <Link href="/admin/dashboard/stories/create" className="block h-full">
            <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <BookImage className="text-orange-500" /> Create Web Story
                  </CardTitle>
                  <CardDescription>
                      Build and publish engaging web stories with AI assistance.
                  </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button className="w-full" variant="secondary">
                    Build Story
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/edit" className="block h-full">
            <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
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

          <Link href="/admin/dashboard/stories" className="block h-full">
            <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <History className="text-cyan-500" /> Manage Web Stories
                  </CardTitle>
                  <CardDescription>
                      Edit, update, and manage all your existing web stories.
                  </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button variant="secondary" className="w-full">
                    Manage Stories
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/dashboard/author" className="block h-full">
            <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                      <UserCircle className="text-indigo-500" /> Manage Author
                  </CardTitle>
                  <CardDescription>
                      Update the author's public photo, name, title, and bio.
                  </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button variant="secondary" className="w-full">
                    Update Author Info
                </Button>
              </CardContent>
            </Card>
          </Link>

      </div>
    </main>
  );
}
