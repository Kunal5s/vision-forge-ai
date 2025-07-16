
import Image from 'next/image';
import Link from 'next/link';

export function AuthorBio() {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-lg border bg-muted/50 p-6">
      <Link href="/author/kunal-sonpitre">
        <Image
          src="https://placehold.co/100x100.png"
          alt="Kunal Sonpitre"
          width={100}
          height={100}
          className="rounded-full shrink-0"
          data-ai-hint="male portrait"
        />
      </Link>
      <div>
        <h3 className="text-xl font-bold text-foreground">
          <Link href="/author/kunal-sonpitre">Kunal Sonpitre</Link>
        </h3>
        <p className="text-sm font-semibold text-primary mb-2">AI & Business Technical Expert</p>
        <p className="text-sm text-muted-foreground">
          Kunal is an expert in leveraging artificial intelligence to solve complex business challenges. With a deep understanding of both technology and market dynamics, he specializes in creating innovative AI-driven solutions and content strategies. His work focuses on making advanced technology accessible and practical for creators and businesses alike. Through his articles on Imagen BrainAi, Kunal shares his insights on AI trends, prompt engineering, and the future of digital creativity, empowering readers to harness the full potential of AI.
        </p>
      </div>
    </div>
  );
}
