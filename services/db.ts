import { supabase } from '../lib/supabase';
import { Product, Partner, Invoice, TransactionType, DashboardStats, CartItem } from '../types';

export const db = {
  // --- Products ---
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data || [];
  },
  saveProduct: async (product: Product) => {
    const payload = {
      name: product.name,
      category: product.category,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      min_stock: product.min_stock,
      image_url: product.image_url
    };

    if (product.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', product.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) throw error;
    }
  },
  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Partners ---
  getPartners: async (): Promise<Partner[]> => {
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  savePartner: async (partner: Partner) => {
    if (partner.id) {
      const { error } = await supabase.from('partners').update(partner).eq('id', partner.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('partners').insert([partner]);
      if (error) throw error;
    }
  },
  deletePartner: async (id: string) => {
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Invoices & Transactions ---
  createInvoice: async (invoice: Invoice) => {
    // 1. Insert Invoice
    const invoiceData = {
      type: invoice.type,
      partner_id: invoice.partner_id || null,
      partner_name: invoice.partner_name,
      total_amount: invoice.total_amount,
      discount: invoice.discount,
      final_amount: invoice.final_amount,
      paid_amount: invoice.paid_amount,
      remaining_amount: invoice.remaining_amount,
      status: invoice.remaining_amount > 0 ? (invoice.paid_amount > 0 ? 'partial' : 'unpaid') : 'paid'
    };

    const { data: insertedInvoice, error: invError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();
    
    if (invError) throw invError;

    // 2. Insert Invoice Items
    const itemsData = invoice.items.map(item => ({
      invoice_id: insertedInvoice.id,
      product_id: item.id || item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      cost: item.cost
    }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsData);
    if (itemsError) throw itemsError;

    // 3. Update Product Stock
    for (const item of invoice.items) {
      const pid = item.id || item.product_id;
      // Get current stock first to be safe, or use RPC for atomicity (skipping RPC for simplicity here)
      const { data: prod } = await supabase.from('products').select('stock').eq('id', pid).single();
      if (prod) {
        const newStock = invoice.type === TransactionType.SALE 
          ? prod.stock - item.quantity 
          : prod.stock + item.quantity;
        
        await supabase.from('products').update({ stock: newStock }).eq('id', pid);
      }
    }

    // 4. Update Partner Balance (Credit/Debit)
    if (invoice.partner_id) {
      const { data: partner } = await supabase.from('partners').select('balance').eq('id', invoice.partner_id).single();
      if (partner) {
        let balanceChange = 0;
        // If Sale: Remaining amount is Debt (+ balance)
        // If Purchase: Remaining amount is Credit (- balance, meaning we owe them)
        if (invoice.type === TransactionType.SALE) {
          balanceChange = invoice.remaining_amount; 
        } else {
          balanceChange = -(invoice.remaining_amount); 
        }
        
        await supabase.from('partners').update({ balance: partner.balance + balanceChange }).eq('id', invoice.partner_id);
      }
    }

    return insertedInvoice;
  },

  getInvoices: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`*, invoice_items(*)`)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // --- Stats ---
  getStats: async (): Promise<DashboardStats> => {
    // This is a heavy client-side calculation. In production, use Supabase RPC functions.
    const { data: invoices } = await supabase.from('invoices').select('type, final_amount, date');
    const { data: products } = await supabase.from('products').select('stock, min_stock');
    
    if (!invoices || !products) return { totalSales: 0, totalPurchases: 0, lowStockCount: 0, monthlyRevenue: 0 };

    const currentMonth = new Date().getMonth();
    
    const totalSales = invoices
      .filter(i => i.type === TransactionType.SALE)
      .reduce((acc, curr) => acc + curr.final_amount, 0);

    const totalPurchases = invoices
      .filter(i => i.type === TransactionType.PURCHASE)
      .reduce((acc, curr) => acc + curr.final_amount, 0);

    const monthlyRevenue = invoices
      .filter(i => i.type === TransactionType.SALE && new Date(i.date).getMonth() === currentMonth)
      .reduce((acc, curr) => acc + curr.final_amount, 0);

    const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;

    return { totalSales, totalPurchases, lowStockCount, monthlyRevenue };
  }
};