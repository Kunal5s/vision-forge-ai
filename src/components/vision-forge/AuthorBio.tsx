
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { AuthorData } from '@/lib/author';

interface AuthorBioProps {
    author: AuthorData;
}

export function AuthorBio({ author }: AuthorBioProps) {

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
        <p className="text-sm text-muted-foreground">
          {author.bio}
        </p>
      </div>
    </div>
  );
}
