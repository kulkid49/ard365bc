import {
  buildActivitySeries,
  collectionsCustomers,
  creditProfiles,
  customers,
  disputes,
  dispatchInvoices,
  invoices,
  pipelineStageStats,
  lifecycleByKey,
  lifecycleTrace,
  approvalRequests,
  openArItems,
  payments,
  poIntakeEmails,
  purchaseOrders,
  salesOrders,
  shipments,
  agenticCasesToday,
  auditEvents,
  valueKpis,
} from '@/data/mockData'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getPurchaseOrders() {
  await sleep(180)
  return purchaseOrders
}

export async function getPoIntakeEmails() {
  await sleep(180)
  return poIntakeEmails
}

export async function getValueKpis() {
  await sleep(180)
  return valueKpis
}

export async function getPipelineStageStats() {
  await sleep(180)
  return pipelineStageStats
}

export async function getAgenticCases() {
  await sleep(180)
  return agenticCasesToday
}

export async function getApprovalRequests() {
  await sleep(180)
  return approvalRequests
}

export async function getDispatchInvoices() {
  await sleep(180)
  return dispatchInvoices
}

export async function getAuditEvents() {
  await sleep(180)
  return auditEvents
}

export async function getCustomers() {
  await sleep(160)
  return customers
}

export async function getCreditProfiles() {
  await sleep(160)
  return creditProfiles
}

export async function getSalesOrders() {
  await sleep(160)
  return salesOrders
}

export async function getShipments() {
  await sleep(160)
  return shipments
}

export async function getInvoices() {
  await sleep(160)
  return invoices
}

export async function getOpenArItems() {
  await sleep(160)
  return openArItems
}

export async function getPayments() {
  await sleep(160)
  return payments
}

export async function getDisputes() {
  await sleep(160)
  return disputes
}

export async function getCollectionsCustomers() {
  await sleep(160)
  return collectionsCustomers
}

export async function getAnalyticsSeries() {
  await sleep(180)
  return buildActivitySeries()
}

export async function getLifecycle(input: string) {
  await sleep(180)
  const key = input in lifecycleByKey ? input : 'SO-20260423-4782'
  return { key, ...lifecycleByKey[key], trace: lifecycleTrace }
}
