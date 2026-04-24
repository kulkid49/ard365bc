import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import DashboardPage from '@/pages/Dashboard'
import CaseDetailPage from '@/pages/CaseDetail'
import TransactionPipelinePage from '@/pages/TransactionPipeline'
import CasesInboxPage from '@/pages/CasesInbox'
import HitlWorkbenchPage from '@/pages/HitlWorkbench'
import CustomerMasterPage from '@/pages/CustomerMaster'
import BillingSalesOrderReviewPage from '@/pages/BillingSalesOrderReview'
import TaxReviewPage from '@/pages/TaxReview'
import ApprovalsPage from '@/pages/Approvals'
import EInvoiceDispatchPage from '@/pages/EInvoiceDispatch'
import AuditCompliancePage from '@/pages/AuditCompliance'
import AgentConsolePage from '@/pages/AgentConsole'
import ReportsPage from '@/pages/Reports'
import ConfigurationPage from '@/pages/Configuration'
import PoIntakeExtractionPage from '@/pages/PoIntake'
import CustomerValidationOnboardingPage from '@/pages/CustomerValidation'
import CreditRiskAssessmentPage from '@/pages/CreditAssessment'
import SalesOrderProcessingPage from '@/pages/SalesOrders'
import FulfilmentLogisticsMonitoringPage from '@/pages/Fulfilment'
import IntelligentBillingPage from '@/pages/IntelligentBilling'
import AROpenItemsMonitoringPage from '@/pages/ARMonitoring'
import CashApplicationPaymentsPage from '@/pages/CashApplication'
import DisputeDeductionManagementPage from '@/pages/Disputes'
import DunningCollectionsPage from '@/pages/Collections'
import LifecycleTrackerPage from '@/pages/LifecycleTracker'
import AgentsConsolePage from '@/pages/AgentsConsole'
import AnalyticsReportingDashboardPage from '@/pages/Analytics'
import SettingsConfigurationPage from '@/pages/Settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pipeline', element: <TransactionPipelinePage /> },
      { path: 'cases', element: <CasesInboxPage /> },
      { path: 'cases/:caseId', element: <CaseDetailPage /> },
      { path: 'hitl', element: <HitlWorkbenchPage /> },
      { path: 'customers', element: <CustomerMasterPage /> },
      { path: 'sales-orders', element: <BillingSalesOrderReviewPage /> },
      { path: 'tax-review', element: <TaxReviewPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'e-invoice-dispatch', element: <EInvoiceDispatchPage /> },
      { path: 'audit-compliance', element: <AuditCompliancePage /> },
      { path: 'agent-console', element: <AgentConsolePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'configuration', element: <ConfigurationPage /> },
      { path: 'po-intake', element: <PoIntakeExtractionPage /> },
      { path: 'customer-validation', element: <CustomerValidationOnboardingPage /> },
      { path: 'credit-assessment', element: <CreditRiskAssessmentPage /> },
      { path: 'otc/sales-orders', element: <SalesOrderProcessingPage /> },
      { path: 'fulfilment', element: <FulfilmentLogisticsMonitoringPage /> },
      { path: 'intelligent-billing', element: <IntelligentBillingPage /> },
      { path: 'ar-monitoring', element: <AROpenItemsMonitoringPage /> },
      { path: 'cash-application', element: <CashApplicationPaymentsPage /> },
      { path: 'disputes', element: <DisputeDeductionManagementPage /> },
      { path: 'collections', element: <DunningCollectionsPage /> },
      { path: 'lifecycle-tracker', element: <LifecycleTrackerPage /> },
      { path: 'agents-console', element: <AgentsConsolePage /> },
      { path: 'analytics', element: <AnalyticsReportingDashboardPage /> },
      { path: 'settings', element: <SettingsConfigurationPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
