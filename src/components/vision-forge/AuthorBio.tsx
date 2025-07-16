
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { AuthorData } from '@/lib/author';
import { getAuthorData } from '@/app/admin/dashboard/author/actions';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import parse from 'html-react-parser';

interface AuthorBioProps {
    author?: AuthorData;
}

const AuthorBioSkeleton = () => (
    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-lg border bg-muted/50 p-6">
        <Skeleton className="h-[100px] w-[100px] rounded-full shrink-0" />
        <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    </div>
);


export function AuthorBio({ author: initialAuthor }: AuthorBioProps) {
  const [author, setAuthor] = useState<AuthorData | null>(initialAuthor || null);
  const [isLoading, setIsLoading] = useState(!initialAuthor);

  useEffect(() => {
    if (!initialAuthor) {
      setIsLoading(true);
      getAuthorData()
        .then(setAuthor)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [initialAuthor]);

  if (isLoading) {
    return <AuthorBioSkeleton />;
  }

  if (!author) {
    return null; // Or some fallback UI if author data can't be fetched
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-lg border bg-muted/50 p-6">
      <Link href="/author/kunal-sonpitre">
        <Image
          src={author.photoUrl}
          alt={author.name}
          width={100}
          height={100}
          className="rounded-full shrink-0 object-cover"
          data-ai-hint="male portrait"
        />
      </Link>
      <div>
        <h3 className="text-xl font-bold text-foreground">
          <Link href="/author/kunal-sonpitre">{author.name}</Link>
        </h3>
        <p className="text-sm font-semibold text-primary mb-2">{author.title}</p>
        <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
          {parse(author.bio)}
        </div>
      </div>
    </div>
  );
}
