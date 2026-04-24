import {
  buildActivitySeries,
  collectionsCustomers,
  creditProfiles,
  customers,
  disputes,
  invoices,
  lifecycleByKey,
  lifecycleTrace,
  openArItems,
  payments,
  poIntakeEmails,
  purchaseOrders,
  salesOrders,
  shipments,
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
