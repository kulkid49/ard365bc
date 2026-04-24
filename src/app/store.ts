import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AgentStatus = 'healthy' | 'warning' | 'down'

export type Agent = {
  id: string
  name: string
  status: AgentStatus
  detail: string
  queue: number
  avgProcessingTimeSec?: number
  lastActivityMinAgo?: number
  confidencePct?: number
}

export type ThemeMode = 'light' | 'dark'

export type UserRole = 'Operator' | 'Approver' | 'Admin' | 'Tax/Legal' | 'IT'

export type CurrentUser = {
  initials: string
  displayName: string
  role: UserRole
}

export type D365ConnectionStatus = {
  state: 'connected' | 'degraded' | 'down'
  lastSeenSecAgo: number
  odataHealthy: boolean
  lastCalls: { name: string; ok: boolean; at: string }[]
  errorRate24hPct: number
}

type AppState = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void

  user: CurrentUser
  setUserRole: (role: UserRole) => void

  notifications: { hitlPending: number; escalations: number }
  setNotifications: (patch: Partial<AppState['notifications']>) => void

  d365: D365ConnectionStatus
  simulateD365Ping: () => void

  agents: Agent[]
  setAgentStatus: (agentId: string, status: AgentStatus, detail?: string) => void

  lastRefreshedAt: number
  refreshNow: () => void

  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (enabled: boolean) => void
  autoRefreshIntervalMs: number
}

const defaultAgents: Agent[] = [
  {
    id: 'intake-agent',
    name: 'Intake Agent',
    status: 'healthy',
    detail: 'Email + upload ingestion stable',
    queue: 3,
    avgProcessingTimeSec: 12,
    lastActivityMinAgo: 1,
  },
  {
    id: 'contract-intel-agent',
    name: 'Contract Intelligence',
    status: 'warning',
    detail: 'Low-confidence queue elevated',
    queue: 14,
    avgProcessingTimeSec: 144,
    lastActivityMinAgo: 3,
    confidencePct: 91.2,
  },
  {
    id: 'customer-master-agent',
    name: 'Customer Master',
    status: 'healthy',
    detail: 'D365 duplicate checks healthy',
    queue: 0,
    avgProcessingTimeSec: 28,
    lastActivityMinAgo: 11,
  },
  {
    id: 'billing-agent',
    name: 'Billing Agent',
    status: 'healthy',
    detail: 'SO draft generation stable',
    queue: 7,
    avgProcessingTimeSec: 45,
    lastActivityMinAgo: 8,
  },
  {
    id: 'approval-orchestrator',
    name: 'Approval Orchestration',
    status: 'healthy',
    detail: 'Approvals routing normal',
    queue: 5,
    avgProcessingTimeSec: 19,
    lastActivityMinAgo: 22,
  },
  {
    id: 'einvoice-dispatch-agent',
    name: 'E-Invoice & Dispatch',
    status: 'down',
    detail: 'IRP retry required',
    queue: 2,
    lastActivityMinAgo: 41,
  },
]

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

      user: { initials: 'S', displayName: 'Samya Soren', role: 'Operator' },
      setUserRole: (role) => set((s) => ({ user: { ...s.user, role } })),

      notifications: { hitlPending: 12, escalations: 3 },
      setNotifications: (patch) => set((s) => ({ notifications: { ...s.notifications, ...patch } })),

      d365: {
        state: 'connected',
        lastSeenSecAgo: 47,
        odataHealthy: true,
        errorRate24hPct: 0.4,
        lastCalls: [
          { name: 'Customer', ok: true, at: '11 min ago' },
          { name: 'Sales Order', ok: true, at: '14 min ago' },
          { name: 'Invoice', ok: true, at: '18 min ago' },
        ],
      },
      simulateD365Ping: () => {
        const states: AppState['d365']['state'][] = ['connected', 'degraded', 'down']
        const next = states[(states.indexOf(get().d365.state) + 1) % states.length]
        set((s) => ({
          d365: {
            ...s.d365,
            state: next,
            lastSeenSecAgo: Math.max(12, Math.floor(Math.random() * 90)),
            odataHealthy: next !== 'down',
            errorRate24hPct: next === 'connected' ? 0.4 : next === 'degraded' ? 2.7 : 9.4,
            lastCalls: s.d365.lastCalls.map((c) => ({ ...c, ok: next !== 'down' })),
          },
        }))
      },

      agents: defaultAgents,
      setAgentStatus: (agentId, status, detail) =>
        set((state) => ({
          agents: state.agents.map((a) => (a.id === agentId ? { ...a, status, detail: detail ?? a.detail } : a)),
        })),

      lastRefreshedAt: Date.now(),
      refreshNow: () => set({ lastRefreshedAt: Date.now() }),

      autoRefreshEnabled: true,
      setAutoRefreshEnabled: (enabled) => set({ autoRefreshEnabled: enabled }),
      autoRefreshIntervalMs: 30_000,
    }),
    {
      name: 'agentic-ar-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        user: state.user,
      }),
    },
  ),
)
