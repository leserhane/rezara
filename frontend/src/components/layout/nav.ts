import {
  LayoutDashboard, Users, FileText, Glasses, Package, ShoppingCart,
  Wallet, Receipt, Settings, type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/prescriptions', label: 'Ordonnances', icon: FileText },
  { to: '/products', label: 'Produits & Stock', icon: Glasses },
  { to: '/sales', label: 'Ventes', icon: ShoppingCart },
  { to: '/cash-register', label: 'Caisse', icon: Wallet },
  { to: '/invoices', label: 'Factures', icon: Receipt },
  { to: '/settings', label: 'Paramètres', icon: Settings, adminOnly: true },
]

export const mobileNavItems: NavItem[] = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/sales', label: 'Ventes', icon: ShoppingCart },
  { to: '/cash-register', label: 'Caisse', icon: Wallet },
  { to: '/products', label: 'Stock', icon: Package },
]
