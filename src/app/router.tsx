import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import DashboardPage from '@/pages/Dashboard'
import {
  AROpenItemsMonitoringPage,
  AgentsConsolePage,
  AnalyticsReportingDashboardPage,
  CashApplicationPaymentsPage,
  CreditRiskAssessmentPage,
  CustomerValidationOnboardingPage,
  DisputeDeductionManagementPage,
  DunningCollectionsPage,
  FulfilmentLogisticsMonitoringPage,
  IntelligentBillingPage,
  LifecycleTrackerPage,
  PoIntakeExtractionPage,
  SalesOrderProcessingPage,
  SettingsConfigurationPage,
} from '@/pages/Pages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'po-intake', element: <PoIntakeExtractionPage /> },
      { path: 'customer-validation', element: <CustomerValidationOnboardingPage /> },
      { path: 'credit-assessment', element: <CreditRiskAssessmentPage /> },
      { path: 'sales-orders', element: <SalesOrderProcessingPage /> },
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

