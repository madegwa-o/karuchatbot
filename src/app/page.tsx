import Link from "next/link";

export default function Home() {
  return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <nav className="flex flex-col items-center gap-6">
        <span className="font-mono text-xs tracking-widest text-yellow-600 dark:text-yellow-500 mb-2">
          ◈ RAG STUDIO
        </span>
          <Link
              href="/upload"
              className="w-48 text-center px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded text-sm font-mono tracking-wider text-zinc-700 dark:text-zinc-300 hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors"
          >
            Upload Docs
          </Link>
          <Link
              href="/chat"
              className="w-48 text-center px-6 py-3 bg-yellow-500 rounded text-sm font-mono tracking-wider text-black font-bold hover:opacity-85 transition-opacity"
          >
            Chat
          </Link>
        </nav>
      </div>
  );
}