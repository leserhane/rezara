import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ClientsListPage } from '@/pages/clients/ClientsListPage'
import { ClientDetailPage } from '@/pages/clients/ClientDetailPage'
import { PrescriptionsListPage } from '@/pages/prescriptions/PrescriptionsListPage'
import { ProductsListPage } from '@/pages/products/ProductsListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { SalesListPage } from '@/pages/sales/SalesListPage'
import { NewSalePage } from '@/pages/sales/NewSalePage'
import { SaleDetailPage } from '@/pages/sales/SaleDetailPage'
import { CashRegisterPage } from '@/pages/cash/CashRegisterPage'
import { InvoicesListPage } from '@/pages/invoices/InvoicesListPage'
import { InvoiceDetailPage } from '@/pages/invoices/InvoiceDetailPage'
import { SuppliersListPage } from '@/pages/suppliers/SuppliersListPage'
import { QuotesListPage } from '@/pages/quotes/QuotesListPage'
import { NewQuotePage } from '@/pages/quotes/NewQuotePage'
import { QuoteDetailPage } from '@/pages/quotes/QuoteDetailPage'
import { OrdersKanbanPage } from '@/pages/orders/OrdersKanbanPage'
import { LensOrderSheetPage } from '@/pages/orders/LensOrderSheetPage'
import { DeliveriesListPage } from '@/pages/deliveries/DeliveriesListPage'
import { ExpensesListPage } from '@/pages/expenses/ExpensesListPage'
import { CreditsListPage } from '@/pages/credits/CreditsListPage'
import { CreditDetailPage } from '@/pages/credits/CreditDetailPage'
import { StatisticsPage } from '@/pages/statistics/StatisticsPage'
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/prescriptions" element={<PrescriptionsListPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/suppliers" element={<SuppliersListPage />} />
          <Route path="/quotes" element={<QuotesListPage />} />
          <Route path="/quotes/new" element={<NewQuotePage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />
          <Route path="/sales" element={<SalesListPage />} />
          <Route path="/sales/new" element={<NewSalePage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/sales/:saleId/lens-sheet" element={<LensOrderSheetPage />} />
          <Route path="/cash-register" element={<CashRegisterPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/credits" element={<CreditsListPage />} />
          <Route path="/credits/:id" element={<CreditDetailPage />} />
          <Route path="/orders" element={<OrdersKanbanPage />} />
          <Route path="/deliveries" element={<DeliveriesListPage />} />
          <Route path="/expenses" element={<ExpensesListPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AppLayout />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
