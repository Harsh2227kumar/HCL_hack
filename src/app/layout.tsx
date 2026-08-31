import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Adaptive Learning',
  description: 'Phase 4 Adaptive Learning App',
};

import FloatingAdvisor from '@/components/chat/FloatingAdvisor';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-50 text-zinc-900 min-h-screen flex flex-col`}>
        <header className="bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              AdaptiveLearning
            </Link>
            <nav className="flex gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Dashboard
              </Link>
              <Link href="/settings" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Settings
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <FloatingAdvisor />
      </body>
    </html>
  );
}
