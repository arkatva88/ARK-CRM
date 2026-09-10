export interface User {
  id: number;
  username: string;
  password?: string;
  full_name: string;
  dob: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  email: string | null;
  email2: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  created_at: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  invoice_date: string;
  due_date: string | null;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  total_amount: number;
  advance_amount: number;
  is_advance_paid: boolean;
  notes: string | null;
  created_at: string;
  clients?: Client;
  invoice_items?: InvoiceItem[];
}

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  client_id: number;
  quotation_date: string;
  expiry_date: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total_amount: number;
  notes: string | null;
  created_at: string;
  clients?: Client;
  quotation_items?: QuotationItem[];
}

export interface Receipt {
  id: number;
  receipt_number: string;
  client_id: number;
  amount: number;
  received_date: string;
  description: string | null;
  payment_method: string;
  credited_to_account: string;
  created_at: string;
  clients?: Client;
}

export interface Expense {
  id: number;
  category: string;
  debit_from: string;
  amount: number;
  expense_date: string;
  description: string | null;
  receipt_path: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: number;
  withdrawn_by: string;
  withdrawn_from: string;
  amount: number;
  withdrawal_date: string;
  description: string | null;
  created_at: string;
}

export interface CapitalInjection {
  id: number;
  brought_in_by: string;
  deposited_to: string;
  amount: number;
  deposit_date: string;
  category: string;
  payment_mode: string;
  reference_number?: string | null;
  description?: string | null;
  created_at: string;
}

export interface Service {
  id: number;
  client_id: number;
  service_type: string;
  domain_name: string | null;
  cost: number;
  purchase_date: string | null;
  duration: string | null;
  name_of_service: string | null;
  expiry_date: string;
  last_reminder_sent: string | null;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  clients?: Client;
}

export interface Ticket {
  id: number;
  client_id: number;
  subject: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  clients?: Client;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number | null;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  invoice_id: number | null;
  client_id: number;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  account_credited: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  clients?: Client;
}
