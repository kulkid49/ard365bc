import { addMilliseconds } from 'date-fns'

export type DashboardSummary = {
  totalPOs: number
  newPOs: number
  processedPOs: number
  timeSavedMinutes: number
  openARValueCr: number
  touchlessRatePct: number
  touchlessDeltaPct: number
  monthlyPOs: number
  exceptionsActive: number
  pipeline: { touchless: number; pending: number; blocked: number }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  // TODO: Replace with D365 Business Central Connector (MCP Server) API call.
  // Example: return await fetch(`${D365_MCP_BASE_URL}/otc/dashboardSummary`).then(r => r.json())
  await sleep(250)

  return {
    totalPOs: 142,
    newPOs: 18,
    processedPOs: 124,
    timeSavedMinutes: 5_670,
    openARValueCr: 14.8,
    touchlessRatePct: 91.4,
    touchlessDeltaPct: 4.2,
    monthlyPOs: 47,
    exceptionsActive: 9,
    pipeline: { touchless: 32, pending: 11, blocked: 4 },
  }
}

export async function handoffToAgent(
  _agentId: string,
  _payload: unknown,
): Promise<{ ok: true; nextCheckAt: string }> {
  // TODO: Replace with Power Automate / agent handoff call.
  // Example: return await fetch(`${POWER_AUTOMATE_URL}/handoff/${agentId}`, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json())
  await sleep(350)

  return { ok: true, nextCheckAt: addMilliseconds(new Date(), 6_000).toISOString() }
}
