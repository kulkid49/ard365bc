import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AgentStatus = 'healthy' | 'warning' | 'down'

export type Agent = {
  id: string
  name: string
  status: AgentStatus
  detail: string
}

export type ThemeMode = 'light' | 'dark'

export type CurrentUser = {
  initials: string
  displayName: string
}

type AppState = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void

  user: CurrentUser

  agents: Agent[]
  setAgentStatus: (agentId: string, status: AgentStatus, detail?: string) => void

  lastRefreshedAt: number
  refreshNow: () => void

  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (enabled: boolean) => void
  autoRefreshIntervalMs: number
}

const defaultAgents: Agent[] = [
  { id: 'po-extractor', name: 'Extractor', status: 'healthy', detail: 'OCR + NLP pipeline stable' },
  { id: 'customer-agent', name: 'Customer', status: 'healthy', detail: 'Validation checks healthy' },
  { id: 'credit-agent', name: 'Credit', status: 'warning', detail: 'Risk model queue elevated' },
  { id: 'so-agent', name: 'Sales Order', status: 'healthy', detail: 'SO creation stable' },
  { id: 'fulfilment-agent', name: 'Fulfilment', status: 'healthy', detail: 'Carrier updates normal' },
  { id: 'billing-agent', name: 'Billing', status: 'healthy', detail: 'Invoice posting stable' },
  { id: 'ar-agent', name: 'AR Monitor', status: 'warning', detail: 'Aging sync delayed' },
  { id: 'cash-app-agent', name: 'Cash App', status: 'healthy', detail: 'Bank statement match ok' },
  { id: 'collections-agent', name: 'Collections', status: 'down', detail: 'Handoff endpoint unavailable' },
]

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

      user: { initials: 'S', displayName: 'Samya Soren' },

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
      name: 'q-agent-otc-store',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
