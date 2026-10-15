import { useState } from 'react'

interface SummaryCard {
  id: string
  label: string
  count: number
  description: string
  badgeText: string
  badgeClasses: string
  borderAccent: string
}

interface RecentActivity {
  id: string
  title: string
  category: 'API Testing' | 'Automation' | 'Manual Test'
  timestamp: string
  status: 'Passed' | 'Updated' | 'Draft'
  statusClasses: string
}

type NavigationTab = 'dashboard' | 'test-items' | 'api-playground'

/**
 * Centrally defined dummy metrics and activities.
 * Clearly marked as demonstration data (not connected to live backend/database).
 */
const SUMMARY_METRICS: SummaryCard[] = [
  {
    id: 'total',
    label: 'Total Test Items',
    count: 24,
    description: 'Total test cases defined in the testing suite catalog.',
    badgeText: 'All Suites',
    badgeClasses: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    borderAccent: 'border-t-indigo-500',
  },
  {
    id: 'draft',
    label: 'Draft',
    count: 8,
    description: 'New scenarios awaiting review or specification refinement.',
    badgeText: 'In Review',
    badgeClasses: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderAccent: 'border-t-amber-500',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    count: 7,
    description: 'Active test specifications currently being authored or executed.',
    badgeText: 'Active',
    badgeClasses: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    borderAccent: 'border-t-sky-500',
  },
  {
    id: 'completed',
    label: 'Completed',
    count: 9,
    description: 'Verified test cases with passing automated and manual runs.',
    badgeText: 'Verified',
    badgeClasses: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderAccent: 'border-t-emerald-500',
  },
]

const DEMO_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-1',
    title: 'Executed boundary test suite for POST /api/test-items (255 characters)',
    category: 'API Testing',
    timestamp: '15 minutes ago',
    status: 'Passed',
    statusClasses: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'act-2',
    title: 'Refined timestamp plausibility assertions on TC-PUT-001 test specification',
    category: 'Automation',
    timestamp: '1 hour ago',
    status: 'Updated',
    statusClasses: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  {
    id: 'act-3',
    title: 'Created new manual test case draft for End-to-End Item Lifecycle',
    category: 'Manual Test',
    timestamp: '3 hours ago',
    status: 'Draft',
    statusClasses: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems: { id: NavigationTab; label: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'test-items', label: 'Test Items', badge: 'Placeholder' },
    { id: 'api-playground', label: 'API Playground', badge: 'Placeholder' },
  ]

  const handleSelectTab = (tabId: NavigationTab) => {
    setActiveTab(tabId)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        id="main-sidebar"
        aria-label="Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
                QA
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-tight text-white leading-tight">
                  QA Playground
                </h1>
                <p className="text-[11px] text-slate-400">Portfolio &amp; Workbench</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              aria-label="Close sidebar menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Navigation Menu
            </p>
            {navItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isActive ? 'bg-indigo-400' : 'bg-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Backend API</span>
              <span className="font-mono text-emerald-400">:3000</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Vite Proxy</span>
              <span className="font-mono text-indigo-400">:5173</span>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400">
            QA Portfolio Playground &bull; Task 9.2
          </p>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="main-sidebar"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight capitalize">
                {activeTab === 'dashboard'
                  ? 'Dashboard Overview'
                  : activeTab === 'test-items'
                    ? 'Test Items (Placeholder)'
                    : 'API Playground (Placeholder)'}
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Software Quality Assurance Workbench
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo Data Mode
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' ? (
            <>
              {/* Welcome Section */}
              <section
                aria-labelledby="welcome-heading"
                className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                      QA Quality Dashboard
                    </span>
                    <h3 id="welcome-heading" className="text-2xl font-bold text-white tracking-tight">
                      Welcome to QA Portfolio Playground
                    </h3>
                  </div>
                  <div className="inline-flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    System Status: Demo
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                  An interactive testing playground showcasing end-to-end Quality Assurance
                  fundamentals, boundary condition assertions, API contract validation, and
                  automated regression suites.
                </p>

                <div className="pt-2 text-xs text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2.5">
                  <svg
                    className="h-4 w-4 text-amber-400 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  <span>
                    <strong>Notice:</strong> All metrics, execution statuses, and recent activity
                    entries below are static demonstration fixtures defined for initial UI layout
                    verification, and do not reflect live database queries.
                  </span>
                </div>
              </section>

              {/* Summary Cards Grid */}
              <section aria-labelledby="metrics-heading" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 id="metrics-heading" className="text-sm font-semibold text-slate-300">
                    Test Execution Metrics
                  </h4>
                  <span className="text-xs text-slate-400">4 Categories Configured</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SUMMARY_METRICS.map((card) => (
                    <article
                      key={card.id}
                      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 border-t-2 ${card.borderAccent}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">{card.label}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${card.badgeClasses}`}
                        >
                          {card.badgeText}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white tracking-tight">
                          {card.count}
                        </span>
                        <span className="text-xs text-slate-400">items</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">{card.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              {/* Content Grid: Status Summary & Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Testing Status Summary */}
                <section
                  aria-labelledby="summary-heading"
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 lg:col-span-1"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 id="summary-heading" className="text-sm font-semibold text-white">
                      Status Distribution
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Demo Ratio</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Completed (9/24)</span>
                        <span className="font-mono text-emerald-400">37.5%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: '37.5%' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Draft (8/24)</span>
                        <span className="font-mono text-amber-400">33.3%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: '33.3%' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>In Progress (7/24)</span>
                        <span className="font-mono text-sky-400">29.2%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: '29.2%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <p className="font-medium text-slate-300">Quality Objective:</p>
                    <p className="leading-relaxed">
                      Maintain 100% test scenario traceability across positive, boundary, and
                      negative paths.
                    </p>
                  </div>
                </section>

                {/* Recent Activities */}
                <section
                  aria-labelledby="activity-heading"
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 lg:col-span-2"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <h4 id="activity-heading" className="text-sm font-semibold text-white">
                        Recent Activity Log
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        Demo Entries
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">3 Most Recent</span>
                  </div>

                  <div className="space-y-3">
                    {DEMO_ACTIVITIES.map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 transition-colors hover:border-slate-700/80"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-200">{activity.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono text-indigo-400">{activity.category}</span>
                            <span>&bull;</span>
                            <span>{activity.timestamp}</span>
                          </div>
                        </div>
                        <div className="self-start sm:self-auto shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${activity.statusClasses}`}
                          >
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    Live database activity streams will be wired in future development stages.
                  </p>
                </section>
              </div>
            </>
          ) : (
            /* Navigation Placeholder View for Test Items and API Playground */
            <section
              aria-labelledby="placeholder-heading"
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-8 shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto text-xl font-bold">
                #
              </div>
              <h3 id="placeholder-heading" className="text-xl font-bold text-white">
                {activeTab === 'test-items' ? 'Test Items Catalog' : 'Interactive API Playground'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This section is reserved for future implementation tasks (e.g. CRUD test item
                management and live request playground). It is currently rendered as an interface
                placeholder.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                &larr; Return to Dashboard
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
