export enum TransactionType {
  SALE = 'بيع',
  PURCHASE = 'شراء'
}

export interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  image_url?: string;
}

export interface Partner {
  id?: string;
  name: string;
  phone: string;
  type: 'customer' | 'supplier';
  balance: number;
}

export interface CartItem extends Product {
  product_id: string; // Foreign key mapping
  quantity: number;
}

export interface Invoice {
  id?: string;
  date?: string;
  type: TransactionType;
  partner_id?: string;
  partner_name: string;
  items: CartItem[];
  total_amount: number;
  discount: number;
  final_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  lowStockCount: number;
  monthlyRevenue: number;
}