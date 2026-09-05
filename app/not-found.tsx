import Link from 'next/link';
import { BookMarked, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 shadow-sm">
        <BookMarked className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The journal page or reflection you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-sm"
      >
        <Home className="w-4 h-4" />
        <span>Return to Journal</span>
      </Link>
    </div>
  );
}
