import {
  LayoutDashboard, Users, FileText, Glasses, Package, ShoppingCart,
  Wallet, Receipt, Settings, Truck, Wrench, CreditCard, FileSpreadsheet,
  BarChart3, CalendarClock, Banknote, ClipboardList, type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Aperçu',
    items: [
      { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/statistics', label: 'Statistiques', icon: BarChart3 },
    ],
  },
  {
    label: 'Clients',
    items: [
      { to: '/clients', label: 'Clients', icon: Users },
      { to: '/prescriptions', label: 'Ordonnances', icon: FileText },
      { to: '/appointments', label: 'Rendez-vous', icon: CalendarClock },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/products', label: 'Produits & Stock', icon: Glasses },
      { to: '/inventory', label: 'Inventaire', icon: ClipboardList },
      { to: '/suppliers', label: 'Fournisseurs', icon: Truck },
    ],
  },
  {
    label: 'Ventes',
    items: [
      { to: '/quotes', label: 'Devis', icon: FileSpreadsheet },
      { to: '/sales', label: 'Ventes', icon: ShoppingCart },
      { to: '/cash-register', label: 'Caisse', icon: Wallet },
      { to: '/invoices', label: 'Factures', icon: Receipt },
      { to: '/credits', label: 'Crédits', icon: CreditCard },
    ],
  },
  {
    label: 'Atelier',
    items: [
      { to: '/orders', label: 'Commandes atelier', icon: Wrench },
      { to: '/deliveries', label: 'Livraisons', icon: Truck },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/expenses', label: 'Dépenses', icon: Banknote },
      { to: '/settings', label: 'Paramètres', icon: Settings, adminOnly: true },
    ],
  },
]

export const navItems: NavItem[] = navSections.flatMap((s) => s.items)

export const mobileNavItems: NavItem[] = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/sales', label: 'Ventes', icon: ShoppingCart },
  { to: '/cash-register', label: 'Caisse', icon: Wallet },
  { to: '/products', label: 'Stock', icon: Package },
]
