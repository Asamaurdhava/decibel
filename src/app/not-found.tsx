import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70dvh] px-4 text-center">
      <p className="text-muted-foreground/20 text-7xl font-mono mb-6">404</p>
      <h2 className="text-lg font-mono font-bold text-foreground uppercase tracking-wider mb-2">Not Found</h2>
      <p className="text-muted-foreground text-sm mb-8">This page doesn&apos;t exist.</p>
      <Link href="/" className="text-primary text-sm font-mono hover:underline">
        Go home
      </Link>
    </div>
  );
}
