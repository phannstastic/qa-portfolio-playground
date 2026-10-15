import { useCallback, useEffect, useState } from 'react'

export type TestItemStatus = 'draft' | 'in_progress' | 'completed' | 'archived'

export interface TestItem {
  id: number
  title: string
  description: string | null
  status: TestItemStatus
  complexity: number
  isAutomated: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

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
 * Centrally defined dummy metrics and activities for Dashboard overview.
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

function getStatusBadge(status: TestItemStatus) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        classes: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      }
    case 'archived':
      return {
        label: 'Archived',
        classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      }
    case 'draft':
    default:
      return {
        label: 'Draft',
        classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      }
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Test Items live API state
  const [testItems, setTestItems] = useState<TestItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Success alert message for operations
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create Modal & Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ title?: string; complexity?: string }>({})
  const [formData, setFormData] = useState<{
    title: string
    description: string
    status: TestItemStatus
    complexity: number | string
    isAutomated: boolean
  }>({
    title: '',
    description: '',
    status: 'draft',
    complexity: 1,
    isAutomated: false,
  })

  const navItems: { id: NavigationTab; label: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'test-items', label: 'Test Items' },
    { id: 'api-playground', label: 'API Playground', badge: 'Placeholder' },
  ]

  const handleSelectTab = (tabId: NavigationTab) => {
    setActiveTab(tabId)
    setIsMobileMenuOpen(false)
  }

  // Fetch test items from live backend API
  const fetchTestItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/test-items', { signal })

      // Handle non-2xx HTTP responses
      if (!res.ok) {
        let errorMsg = `Server error (HTTP ${res.status})`
        try {
          const errorJson = (await res.json()) as ApiResponse<unknown>
          if (errorJson?.error?.message) {
            errorMsg = errorJson.error.message
          }
        } catch {
          // Response body was not JSON; keep status-based fallback
        }
        throw new Error(errorMsg)
      }

      // Parse JSON response envelope
      const json = (await res.json()) as ApiResponse<TestItem[]>
      if (!json.success || !Array.isArray(json.data)) {
        const errorDetail = json.error?.message || 'Invalid API response format received from server.'
        throw new Error(errorDetail)
      }

      setTestItems(json.data)
    } catch (err: unknown) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        return // Component unmounted or superseded request; ignore safely
      }
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while fetching test items.'
      setError(message)
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'test-items') {
      const controller = new AbortController()
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          void fetchTestItems(controller.signal)
        }
      })
      return () => {
        controller.abort()
      }
    }
  }, [activeTab, fetchTestItems])

  // Close modal on Escape key press
  useEffect(() => {
    if (!isCreateModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsCreateModalOpen(false)
        setFormErrors({})
        setCreateError(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCreateModalOpen, isSubmitting])

  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      status: 'draft',
      complexity: 1,
      isAutomated: false,
    })
    setFormErrors({})
    setCreateError(null)
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (isSubmitting) return
    setIsCreateModalOpen(false)
    setFormErrors({})
    setCreateError(null)
  }

  const validateForm = () => {
    const errors: { title?: string; complexity?: string } = {}
    const trimmedTitle = formData.title.trim()

    if (!trimmedTitle) {
      errors.title = 'Title is required and must not be empty or whitespace only.'
    } else if (trimmedTitle.length > 255) {
      errors.title = 'Title must not exceed 255 characters.'
    }

    if (formData.complexity === '' || formData.complexity === null || formData.complexity === undefined) {
      errors.complexity = 'Complexity is required (1 to 10).'
    } else {
      const compNum = Number(formData.complexity)
      if (!Number.isInteger(compNum) || compNum < 1 || compNum > 10) {
        errors.complexity = 'Complexity must be an integer between 1 and 10.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setCreateError(null)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() ? formData.description.trim() : null,
        status: formData.status,
        complexity: Number(formData.complexity),
        isAutomated: Boolean(formData.isAutomated),
      }

      const res = await fetch('/api/test-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // Handle non-2xx HTTP responses
      if (!res.ok) {
        let errorMsg = `Server error (HTTP ${res.status})`
        try {
          const errorJson = (await res.json()) as ApiResponse<unknown>
          if (errorJson?.error?.message) {
            errorMsg = errorJson.error.message
          }
        } catch {
          // Response body was not JSON; keep status-based fallback
        }
        throw new Error(errorMsg)
      }

      // Parse JSON response envelope and verify contract
      const json = (await res.json()) as ApiResponse<TestItem>
      if (res.status !== 201 || !json.success || !json.data || typeof json.data.id !== 'number') {
        const errorDetail = json.error?.message || 'Invalid API response format received from server.'
        throw new Error(errorDetail)
      }

      // Success flow
      setSuccessMessage(`Test item "${json.data.title}" (#${json.data.id}) was created successfully!`)
      setIsCreateModalOpen(false)
      setFormData({
        title: '',
        description: '',
        status: 'draft',
        complexity: 1,
        isAutomated: false,
      })
      setFormErrors({})
      setCreateError(null)

      // Refresh test items catalog
      void fetchTestItems()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while creating test item.'
      setCreateError(message)
    } finally {
      setIsSubmitting(false)
    }
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
            QA Portfolio Playground &bull; Task 9.3
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
                    ? 'Test Items Catalog'
                    : 'API Playground (Placeholder)'}
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {activeTab === 'dashboard'
                  ? 'Software Quality Assurance Workbench'
                  : activeTab === 'test-items'
                    ? 'Backend API Test Cases & Verifications'
                    : 'Interactive API Request Explorer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'test-items' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live API Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                {activeTab === 'dashboard' ? 'Demo Data Mode' : 'Placeholder'}
              </span>
            )}
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
                    entries on this dashboard overview are static demonstration fixtures defined for initial UI layout
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
          ) : activeTab === 'test-items' ? (
            /* Live Test Items Catalog Section */
            <section aria-labelledby="items-heading" className="space-y-5">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 id="items-heading" className="text-lg font-bold text-white tracking-tight">
                      Test Items Catalog
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {testItems.length} {testItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Live test cases fetched directly from <code className="text-indigo-300 font-mono">GET /api/test-items</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    aria-label="Create new test item"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Create Test Item</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchTestItems()}
                    disabled={isLoading}
                    aria-label="Refresh test items"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <svg
                      className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
                  </button>
                </div>
              </div>

              {/* Success Notification Alert */}
              {successMessage && (
                <div
                  role="status"
                  className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-300 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <svg
                      className="h-5 w-5 text-emerald-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">{successMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    aria-label="Dismiss success message"
                    className="p-1 rounded-md text-emerald-400/80 hover:text-emerald-200 hover:bg-emerald-900/50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
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
              )}

              {/* Loading State */}
              {isLoading && testItems.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-400 mx-auto">
                    <svg
                      className="h-6 w-6 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Loading Test Items</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Retrieving test item records from the database via Vite proxy...
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-8 text-center space-y-3.5 shadow-sm">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 text-red-400 mx-auto">
                    <svg
                      className="h-6 w-6"
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
                  </div>
                  <h4 className="text-sm font-semibold text-white">Unable to Fetch Test Items</h4>
                  <p className="text-xs text-red-300/90 max-w-md mx-auto leading-relaxed">
                    {error}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => fetchTestItems()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-red-600 text-white hover:bg-red-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Retry Request
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && testItems.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-800 text-slate-400 mx-auto">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-white">No Test Items Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    The database currently has no records in the catalog. You can create records
                    via Postman collections or backend test suites.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => fetchTestItems()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700/80 hover:text-white transition-colors"
                    >
                      Refresh Status
                    </button>
                  </div>
                </div>
              )}

              {/* Data Table: Desktop & Tablet View */}
              {!error && testItems.length > 0 && (
                <>
                  <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                          <tr>
                            <th scope="col" className="py-3.5 px-4 w-16">
                              ID
                            </th>
                            <th scope="col" className="py-3.5 px-4">
                              Title
                            </th>
                            <th scope="col" className="py-3.5 px-4 max-w-xs">
                              Description
                            </th>
                            <th scope="col" className="py-3.5 px-4">
                              Status
                            </th>
                            <th scope="col" className="py-3.5 px-4 text-center w-24">
                              Complexity
                            </th>
                            <th scope="col" className="py-3.5 px-4 text-center w-28">
                              Automation
                            </th>
                            <th scope="col" className="py-3.5 px-4 text-right">
                              Created At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 text-slate-300">
                          {testItems.map((item) => {
                            const badge = getStatusBadge(item.status)
                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-3.5 px-4 font-mono text-slate-400">
                                  #{item.id}
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-white">
                                  {item.title}
                                </td>
                                <td className="py-3.5 px-4 max-w-xs text-slate-400">
                                  {item.description ? (
                                    <span className="line-clamp-2">{item.description}</span>
                                  ) : (
                                    <span className="italic text-slate-600">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.classes}`}
                                  >
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-semibold">
                                    {item.complexity} / 10
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  {item.isAutomated ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                      Automated
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                                      Manual
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap font-mono text-[11px]">
                                  {formatDate(item.createdAt)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Card View: Mobile Only (< md) */}
                  <div className="md:hidden space-y-3">
                    {testItems.map((item) => {
                      const badge = getStatusBadge(item.status)
                      return (
                        <article
                          key={item.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-slate-400">
                                #{item.id}
                              </span>
                              <h4 className="text-sm font-semibold text-white leading-tight">
                                {item.title}
                              </h4>
                            </div>
                            <span
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.classes}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed">
                            {item.description ? (
                              item.description
                            ) : (
                              <span className="italic text-slate-600">No description provided</span>
                            )}
                          </p>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-medium">
                                Complexity: {item.complexity}/10
                              </span>
                              {item.isAutomated ? (
                                <span className="text-emerald-400 font-medium">&bull; Automated</span>
                              ) : (
                                <span className="text-slate-400">&bull; Manual</span>
                              )}
                            </div>
                            <span className="font-mono text-[10px]">{formatDate(item.createdAt)}</span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </>
              )}
            </section>
          ) : (
            /* Navigation Placeholder View for API Playground */
            <section
              aria-labelledby="placeholder-heading"
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-8 shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto text-xl font-bold">
                #
              </div>
              <h3 id="placeholder-heading" className="text-xl font-bold text-white">
                Interactive API Playground
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This section is reserved for interactive API testing and live request exploration.
                It is currently rendered as an interface placeholder.
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

      {/* Create Test Item Modal Dialog */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={handleCloseCreateModal}
            aria-hidden="true"
          />

          {/* Modal Dialog Content */}
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 my-8 z-10">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <h3 id="create-modal-title" className="text-lg font-bold text-white tracking-tight">
                  Create Test Item
                </h3>
                <p className="text-xs text-slate-400">
                  Add a new test scenario specification via <code className="text-indigo-300 font-mono">POST /api/test-items</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                disabled={isSubmitting}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
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

            {/* Submission Error Banner */}
            {createError && (
              <div
                role="alert"
                className="bg-red-950/40 border border-red-500/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-300"
              >
                <svg
                  className="h-4 w-4 text-red-400 shrink-0 mt-0.5"
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
                <div className="space-y-0.5 flex-1">
                  <p className="font-semibold text-red-200">Failed to create test item</p>
                  <p className="text-red-300/90 leading-relaxed">{createError}</p>
                </div>
              </div>
            )}

            {/* Create Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
              {/* Title Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="field-title" className="text-xs font-semibold text-slate-200">
                    Title <span className="text-indigo-400">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      typeof formData.title === 'string' && formData.title.length > 255
                        ? 'text-red-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {formData.title.length}/255
                  </span>
                </div>
                <input
                  id="field-title"
                  type="text"
                  name="title"
                  maxLength={255}
                  disabled={isSubmitting}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                    if (formErrors.title) {
                      setFormErrors({ ...formErrors, title: undefined })
                    }
                  }}
                  placeholder="e.g. Verify boundary values on POST /api/test-items"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-xs text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    formErrors.title
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                  aria-invalid={formErrors.title ? 'true' : 'false'}
                  aria-describedby={formErrors.title ? 'field-title-error' : undefined}
                />
                {formErrors.title && (
                  <p id="field-title-error" className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                    <svg
                      className="h-3 w-3 shrink-0"
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
                    <span>{formErrors.title}</span>
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="field-description" className="text-xs font-semibold text-slate-200">
                    Description <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                </div>
                <textarea
                  id="field-description"
                  name="description"
                  rows={3}
                  disabled={isSubmitting}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed test preconditions, assertions, expected outcomes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 resize-none"
                />
              </div>

              {/* Status & Complexity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Select */}
                <div className="space-y-1.5">
                  <label htmlFor="field-status" className="text-xs font-semibold text-slate-200">
                    Status
                  </label>
                  <select
                    id="field-status"
                    name="status"
                    disabled={isSubmitting}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TestItemStatus })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  >
                    <option value="draft">Draft (Default)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Complexity Number Input */}
                <div className="space-y-1.5">
                  <label htmlFor="field-complexity" className="text-xs font-semibold text-slate-200">
                    Complexity (1 - 10)
                  </label>
                  <input
                    id="field-complexity"
                    type="number"
                    name="complexity"
                    min={1}
                    max={10}
                    step={1}
                    disabled={isSubmitting}
                    value={formData.complexity}
                    onChange={(e) => {
                      setFormData({ ...formData, complexity: e.target.value })
                      if (formErrors.complexity) {
                        setFormErrors({ ...formErrors, complexity: undefined })
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-xs text-white transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
                      formErrors.complexity
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                    aria-invalid={formErrors.complexity ? 'true' : 'false'}
                    aria-describedby={formErrors.complexity ? 'field-complexity-error' : undefined}
                  />
                  {formErrors.complexity && (
                    <p
                      id="field-complexity-error"
                      className="text-[11px] text-red-400 font-medium flex items-center gap-1"
                    >
                      <svg
                        className="h-3 w-3 shrink-0"
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
                      <span>{formErrors.complexity}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Automation Checkbox */}
              <div className="pt-1">
                <label
                  htmlFor="field-is-automated"
                  className="flex items-start gap-3 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <input
                    id="field-is-automated"
                    type="checkbox"
                    name="isAutomated"
                    disabled={isSubmitting}
                    checked={formData.isAutomated}
                    onChange={(e) => setFormData({ ...formData, isAutomated: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-200 block">
                      Automated Test Case
                    </span>
                    <span className="text-[11px] text-slate-400 block leading-relaxed">
                      Mark this scenario as implemented in an automated regression suite (Default: False).
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Test Item</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
