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
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/prescriptions" element={<PrescriptionsListPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/sales" element={<SalesListPage />} />
          <Route path="/sales/new" element={<NewSalePage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/cash-register" element={<CashRegisterPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
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
