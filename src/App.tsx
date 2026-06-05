import React from 'react';
import CompilerWorkspace from './components/CompilerWorkspace';
import * as LucideIcons from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Visual background ambient details */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Main navigation header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/10">
              <LucideIcons.Box className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-sm text-slate-800 flex items-center gap-2">
                SYNTHESIS-1
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded border border-indigo-100 select-none">COMPILER v4.2.0</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Ready for Input
            </span>
          </div>
        </div>
      </header>

      {/* Workspace central contents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 transition-all">
        <CompilerWorkspace />
      </main>

    </div>
  );
}

