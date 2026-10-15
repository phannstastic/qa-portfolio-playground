export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 antialiased">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Frontend Online
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            QA Portfolio Playground
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            A dedicated playground and portfolio showcase for Quality Assurance (QA) practices,
            including API testing, contract validation, and automated test lifecycle workflows.
          </p>
        </header>

        <section className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Environment & Proxy Status
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Frontend Dev Server:</span>
              <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                http://localhost:5173
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Backend Proxy Target:</span>
              <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-300">
                http://localhost:3000
              </span>
            </div>
          </div>
        </section>

        <section className="text-xs text-slate-400 space-y-1 border-t border-slate-800/80 pt-4">
          <p className="font-medium text-slate-300">Configured Proxy Endpoints:</p>
          <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-slate-400">
            <li>/health &rarr; http://localhost:3000/health</li>
            <li>/api/* &rarr; http://localhost:3000/api/*</li>
          </ul>
        </section>

        <footer className="pt-2 text-center text-xs text-slate-500">
          QA Portfolio &amp; Testing Playground &bull; Phase 3: Frontend Foundation
        </footer>
      </div>
    </main>
  )
}
