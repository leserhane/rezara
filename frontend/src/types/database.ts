// Hand-written types mirroring database/migrations/*.sql.
// If you provision a real Supabase project, you can regenerate this file
// with `supabase gen types typescript --linked` and it should be a
// superset of what's used here.

export type UserRoleKey = 'admin' | 'opticien'
export type GenderType = 'homme' | 'femme' | 'autre'
export type ProductType = 'monture' | 'verre' | 'lentille' | 'accessoire'
export type StockMovementType =
  | 'entree' | 'sortie' | 'transfert' | 'ajustement'
  | 'retour_fournisseur' | 'retour_client' | 'vente' | 'inventaire'
export type SaleStatus = 'non_paye' | 'acompte' | 'partiellement_paye' | 'paye' | 'credit' | 'annule'
export type PaymentType = 'acompte' | 'solde' | 'paiement_total' | 'echeance_credit' | 'remboursement'
export type PaymentMethodCode = 'especes' | 'carte' | 'virement' | 'cheque' | 'mobile' | 'autre'
export type CashRegisterStatus = 'ouverte' | 'cloturee'
export type OrderStatus =
  | 'creee' | 'verres_commandes' | 'en_attente' | 'recue' | 'montage'
  | 'controle' | 'prete' | 'client_informe' | 'livree' | 'annulee'
export type DocumentStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'transforme'
export type NotificationType =
  | 'stock_faible' | 'commande_prete' | 'commande_en_retard' | 'credit_echeance'
  | 'paiement_en_retard' | 'inventaire' | 'nouvelle_vente' | 'remise_validation' | 'autre'

export type Role = {
  id: string
  key: UserRoleKey
  name: string
  description: string | null
  is_system: boolean
  created_at: string
}

export type Store = {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  ice: string | null
  identifiant_fiscal: string | null
  rc: string | null
  patente: string | null
  currency: string
  default_tax_rate: number
  created_at: string
}

export type StoreSettings = {
  store_id: string
  invoice_number_prefix: string
  sale_number_prefix: string
  quote_number_prefix: string
  order_number_prefix: string
  payment_number_prefix: string
  customer_number_prefix: string
  expense_number_prefix: string
  opticien_max_discount_percent: number
  vip_bronze_threshold: number
  vip_silver_threshold: number
  vip_gold_threshold: number
  vip_platinum_threshold: number
  inactive_customer_months: number
  updated_at: string
}

export type Profile = {
  id: string
  store_id: string
  role_id: string
  first_name: string
  last_name: string
  phone: string | null
  is_active: boolean
  max_discount_percent: number
  created_at: string
  updated_at: string
}

export type Brand = {
  id: string
  name: string
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export type Supplier = {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  ice: string | null
  identifiant_fiscal: string | null
  rc: string | null
  payment_terms: string | null
  average_lead_time_days: number | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export type ProductCategory = {
  id: string
  name: string
  group_key: string
  parent_id: string | null
  created_at: string
}

export type PaymentMethod = {
  id: string
  code: PaymentMethodCode
  name: string
  is_active: boolean
}

export type ExpenseCategory = {
  id: string
  name: string
  is_active: boolean
}

export type Customer = {
  id: string
  store_id: string
  customer_number: string
  first_name: string
  last_name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  birth_date: string | null
  gender: GenderType | null
  notes: string | null
  tags: string[]
  assigned_optician_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CustomerNote = {
  id: string
  customer_id: string
  note: string
  created_by: string | null
  created_at: string
}

export type Prescription = {
  id: string
  customer_id: string
  od_sphere: number | null
  od_cylinder: number | null
  od_axis: number | null
  od_addition: number | null
  od_prism: number | null
  od_base: string | null
  od_acuity: string | null
  og_sphere: number | null
  og_cylinder: number | null
  og_axis: number | null
  og_addition: number | null
  og_prism: number | null
  og_base: string | null
  og_acuity: string | null
  pd: number | null
  height: number | null
  correction_type: string | null
  vision_far_notes: string | null
  vision_intermediate_notes: string | null
  vision_near_notes: string | null
  prescription_date: string
  doctor_name: string | null
  valid_until: string | null
  file_url: string | null
  created_by: string | null
  created_at: string
}

export type Product = {
  id: string
  store_id: string
  type: ProductType
  sku: string
  supplier_sku: string | null
  barcode: string | null
  name: string
  brand_id: string | null
  category_id: string | null
  supplier_id: string | null
  photo_url: string | null
  purchase_price_ht: number
  sale_price_ht: number
  tax_rate: number
  sale_price_ttc: number
  margin_amount: number
  margin_percent: number
  quantity: number
  stock_min: number
  stock_max: number | null
  location: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

/** Row from the v_products view — purchase_price_ht/margin are null for non-admins. */
export type ProductWithVisibility = Omit<Product, 'purchase_price_ht' | 'margin_amount' | 'margin_percent'> & {
  purchase_price_ht: number | null
  margin_amount: number | null
  margin_percent: number | null
}

export type FrameDetails = {
  product_id: string
  collection: string | null
  color: string | null
  size: string | null
  shape: string | null
  gender: GenderType | null
  material: string | null
}

export type LensDetails = {
  product_id: string
  verrier: string | null
  lens_type: string | null
  material: string | null
  refractive_index: number | null
  sphere: number | null
  cylinder: number | null
  addition: number | null
  treatment: string | null
  tint: string | null
  diameter: number | null
}

export type ContactLensDetails = {
  product_id: string
  range_name: string | null
  wear_type: string | null
  lens_kind: string | null
  diameter: number | null
  base_curve: number | null
  power: number | null
  cylinder: number | null
  axis: number | null
  addition: number | null
  material: string | null
}

export type StockMovement = {
  id: string
  product_id: string
  type: StockMovementType
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reason: string | null
  reference_type: string | null
  reference_id: string | null
  user_id: string | null
  created_at: string
}

export type Sale = {
  id: string
  store_id: string
  sale_number: string
  customer_id: string
  prescription_id: string | null
  quote_id: string | null
  optician_id: string
  subtotal_ht: number
  discount_amount: number
  discount_percent: number
  discount_authorized_by: string | null
  tax_amount: number
  total_ht: number
  total_ttc: number
  cost_total: number | null
  margin_amount: number
  margin_percent: number
  amount_paid: number
  amount_due: number
  status: SaleStatus
  notes: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

export type SaleItem = {
  id: string
  sale_id: string
  product_id: string | null
  item_role: string
  description: string | null
  quantity: number
  unit_price_ht: number
  unit_cost_ht: number | null
  discount_amount: number
  tax_rate: number
  line_total_ht: number
  line_total_ttc: number
  line_cost_total: number | null
  line_margin: number
}

export type Payment = {
  id: string
  payment_number: string
  sale_id: string | null
  credit_installment_id: string | null
  customer_id: string
  payment_type: PaymentType
  amount: number
  payment_method_id: string
  cash_register_id: string | null
  reference: string | null
  notes: string | null
  user_id: string
  created_at: string
}

export type Credit = {
  id: string
  sale_id: string
  customer_id: string
  initial_amount: number
  paid_amount: number
  balance: number
  due_date: string | null
  frequency: string | null
  status: string
  created_at: string
}

export type CreditInstallment = {
  id: string
  credit_id: string
  due_date: string
  amount: number
  paid_amount: number
  status: string
  paid_at: string | null
}

export type CashRegister = {
  id: string
  store_id: string
  opened_by: string
  opened_at: string
  opening_amount: number
  closed_by: string | null
  closed_at: string | null
  expected_cash: number | null
  actual_cash: number | null
  cash_difference: number | null
  status: CashRegisterStatus
  notes: string | null
}

export type CashMovement = {
  id: string
  cash_register_id: string
  type: string
  amount: number
  payment_method_id: string | null
  reference_type: string | null
  reference_id: string | null
  user_id: string | null
  notes: string | null
  created_at: string
}

export type Invoice = {
  id: string
  store_id: string
  invoice_number: string
  sale_id: string
  customer_id: string
  issued_at: string
  total_ht: number
  tax_amount: number
  total_ttc: number
  amount_paid: number
  amount_due: number
  issued_by: string
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price_ht: number
  discount_amount: number
  tax_rate: number
  line_total_ht: number
  line_total_ttc: number
}

export type Expense = {
  id: string
  store_id: string
  expense_number: string
  category_id: string
  supplier_id: string | null
  expense_date: string
  amount_ht: number
  tax_amount: number
  amount_ttc: number
  payment_method_id: string | null
  receipt_url: string | null
  user_id: string
  comment: string | null
  created_at: string
}

export type Notification = {
  id: string
  store_id: string
  user_id: string | null
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export type CustomerStats = {
  customer_id: string
  store_id: string
  purchase_count: number
  lifetime_value: number
  average_basket: number
  last_purchase_at: string | null
  balance_due: number
  vip_tier: 'bronze' | 'silver' | 'gold' | 'vip'
}

export type Quote = {
  id: string
  store_id: string
  quote_number: string
  customer_id: string
  prescription_id: string | null
  optician_id: string
  status: DocumentStatus
  subtotal_ht: number
  discount_amount: number
  tax_amount: number
  total_ht: number
  total_ttc: number
  valid_until: string | null
  converted_sale_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type QuoteItem = {
  id: string
  quote_id: string
  product_id: string | null
  item_role: string
  description: string | null
  quantity: number
  unit_price_ht: number
  discount_amount: number
  tax_rate: number
  line_total_ht: number
  line_total_ttc: number
}

export type Order = {
  id: string
  store_id: string
  order_number: string
  sale_id: string
  customer_id: string
  supplier_id: string | null
  status: OrderStatus
  expected_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  sale_item_id: string | null
  description: string
  quantity: number
  status: OrderStatus
}

export type OrderStatusHistory = {
  id: string
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by: string | null
  changed_at: string
  notes: string | null
}

export type Delivery = {
  id: string
  order_id: string | null
  sale_id: string
  status: 'en_preparation' | 'prete' | 'livree'
  delivered_at: string | null
  delivered_by: string | null
  received_by_name: string | null
  signature_url: string | null
  notes: string | null
  created_at: string
}

export type Appointment = {
  id: string
  store_id: string
  customer_id: string
  optician_id: string | null
  scheduled_at: string
  reason: string | null
  status: 'planifie' | 'confirme' | 'realise' | 'annule' | 'absent'
  notes: string | null
  created_by: string | null
  created_at: string
}

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}
type TableDef<Row, Insert, Update = Partial<Insert>, Rel extends Relationship[] = []> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Rel
}
type ViewDef<Row, Rel extends Relationship[] = []> = { Row: Row; Relationships: Rel }

type FkTo<Table extends string, Col extends string> = [{
  foreignKeyName: `${Table}_${Col}_fkey`
  columns: [Col]
  isOneToOne: false
  referencedRelation: Table
  referencedColumns: ['id']
}]

export type Database = {
  public: {
    Tables: {
      roles: TableDef<Role, Partial<Role>>
      stores: TableDef<Store, Partial<Store>>
      store_settings: TableDef<StoreSettings, Partial<StoreSettings>>
      profiles: TableDef<Profile, Partial<Profile> & { id: string; store_id: string; role_id: string; first_name: string; last_name: string }>
      brands: TableDef<Brand, Partial<Brand> & { name: string }>
      suppliers: TableDef<Supplier, Partial<Supplier> & { name: string }>
      product_categories: TableDef<ProductCategory, Partial<ProductCategory> & { name: string }>
      payment_methods: TableDef<PaymentMethod, Partial<PaymentMethod>>
      expense_categories: TableDef<ExpenseCategory, Partial<ExpenseCategory> & { name: string }>
      customers: TableDef<Customer, Partial<Customer> & { store_id: string; first_name: string; last_name: string }>
      customer_notes: TableDef<CustomerNote, Partial<CustomerNote> & { customer_id: string; note: string }>
      prescriptions: TableDef<Prescription, Partial<Prescription> & { customer_id: string }, Partial<Prescription>, FkTo<'customers', 'customer_id'>>
      products: TableDef<Product, Partial<Product> & { store_id: string; type: ProductType; sku: string; name: string }>
      frame_details: TableDef<FrameDetails, Partial<FrameDetails> & { product_id: string }>
      lens_details: TableDef<LensDetails, Partial<LensDetails> & { product_id: string }>
      contact_lens_details: TableDef<ContactLensDetails, Partial<ContactLensDetails> & { product_id: string }>
      stock_movements: TableDef<StockMovement, Partial<StockMovement>>
      sales: TableDef<Sale, Partial<Sale>>
      sale_items: TableDef<SaleItem, Partial<SaleItem>>
      payments: TableDef<Payment, Partial<Payment>, Partial<Payment>, FkTo<'payment_methods', 'payment_method_id'>>
      credits: TableDef<Credit, Partial<Credit>, Partial<Credit>, [...FkTo<'sales', 'sale_id'>, ...FkTo<'customers', 'customer_id'>]>
      credit_installments: TableDef<CreditInstallment, Partial<CreditInstallment>>
      cash_registers: TableDef<CashRegister, Partial<CashRegister>>
      cash_movements: TableDef<CashMovement, Partial<CashMovement>, Partial<CashMovement>, FkTo<'payment_methods', 'payment_method_id'>>
      invoices: TableDef<Invoice, Partial<Invoice>, Partial<Invoice>, FkTo<'customers', 'customer_id'>>
      invoice_items: TableDef<InvoiceItem, Partial<InvoiceItem>>
      expenses: TableDef<Expense, Partial<Expense> & { store_id: string; category_id: string; amount_ht: number; user_id: string }, Partial<Expense>, FkTo<'expense_categories', 'category_id'>>
      notifications: TableDef<Notification, Partial<Notification>>
      quotes: TableDef<Quote, Partial<Quote> & { store_id: string; customer_id: string; optician_id: string }, Partial<Quote>, FkTo<'customers', 'customer_id'>>
      quote_items: TableDef<QuoteItem, Partial<QuoteItem> & { quote_id: string }>
      orders: TableDef<Order, Partial<Order> & { store_id: string; sale_id: string; customer_id: string }, Partial<Order>, [...FkTo<'suppliers', 'supplier_id'>, ...FkTo<'customers', 'customer_id'>]>
      order_items: TableDef<OrderItem, Partial<OrderItem> & { order_id: string; description: string }>
      order_status_history: TableDef<OrderStatusHistory, Partial<OrderStatusHistory>>
      deliveries: TableDef<Delivery, Partial<Delivery> & { sale_id: string }, Partial<Delivery>, FkTo<'sales', 'sale_id'>>
      appointments: TableDef<Appointment, Partial<Appointment> & { store_id: string; customer_id: string; scheduled_at: string }, Partial<Appointment>, FkTo<'customers', 'customer_id'>>
    }
    Views: {
      v_products: ViewDef<ProductWithVisibility>
      v_sales: ViewDef<Sale>
      v_sale_items: ViewDef<SaleItem>
      v_customer_stats: ViewDef<CustomerStats>
      v_low_stock_products: ViewDef<ProductWithVisibility>
    }
    Functions: {
      create_sale: {
        Args: {
          p_customer_id: string
          p_items: {
            product_id: string | null
            item_role: string
            description?: string | null
            quantity: number
            unit_price_ht_override?: number | null
            discount_amount?: number
            tax_rate?: number
          }[]
          p_prescription_id?: string | null
          p_quote_id?: string | null
          p_cart_discount_amount?: number
          p_deposit_amount?: number
          p_payment_method_id?: string | null
          p_cash_register_id?: string | null
          p_discount_authorized_by?: string | null
          p_notes?: string | null
        }
        Returns: Sale
      }
      record_payment: {
        Args: {
          p_sale_id: string
          p_amount: number
          p_payment_type: PaymentType
          p_payment_method_id: string
          p_cash_register_id?: string | null
          p_reference?: string | null
          p_notes?: string | null
          p_credit_installment_id?: string | null
        }
        Returns: Sale
      }
      create_credit: {
        Args: {
          p_sale_id: string
          p_due_date: string
          p_frequency: string
          p_installments: { due_date: string; amount: number }[]
        }
        Returns: Credit
      }
      convert_quote_to_sale: {
        Args: {
          p_quote_id: string
          p_deposit_amount?: number
          p_payment_method_id?: string | null
          p_cash_register_id?: string | null
        }
        Returns: Sale
      }
      update_quote_discount: {
        Args: { p_quote_id: string; p_discount_amount: number }
        Returns: Quote
      }
      record_expense: {
        Args: {
          p_category_id: string
          p_amount_ht: number
          p_tax_amount: number
          p_payment_method_id?: string | null
          p_cash_register_id?: string | null
          p_supplier_id?: string | null
          p_comment?: string | null
          p_receipt_url?: string | null
          p_expense_date?: string
        }
        Returns: Expense
      }
      open_cash_register: {
        Args: { p_opening_amount: number; p_notes?: string | null }
        Returns: CashRegister
      }
      close_cash_register: {
        Args: { p_cash_register_id: string; p_actual_cash: number; p_notes?: string | null }
        Returns: { register: CashRegister; totals_by_method: Record<string, number> }
      }
      apply_stock_movement: {
        Args: {
          p_product_id: string
          p_type: StockMovementType
          p_quantity_change: number
          p_reason?: string | null
          p_reference_type?: string | null
          p_reference_id?: string | null
        }
        Returns: StockMovement
      }
      authorize_discount_override: {
        Args: { p_admin_email: string; p_admin_password: string }
        Returns: string
      }
      cancel_sale: {
        Args: { p_sale_id: string; p_reason: string }
        Returns: Sale
      }
    }
    Enums: {
      user_role_key: UserRoleKey
      product_type: ProductType
      sale_status: SaleStatus
      payment_type: PaymentType
      payment_method_code: PaymentMethodCode
      order_status: OrderStatus
    }
  }
}
