import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ConnectButton from '@/components/shared/ConnectButton';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-4">Welcome to Wonder Finance</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 mb-8">Your smart way to manage digital assets.</p>
        <div className="flex items-center justify-center gap-x-6">
          <Button className="p-6" asChild>
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <ConnectButton />
        </div>
      </div>
      {/* Placeholder for potential future sections */}
      {/* <section id="learn-more" className="mt-16">
        {/* More content can go here */}
      {/* </section> */}
    </main>
  );
}
