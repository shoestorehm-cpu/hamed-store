import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Invoice, TransactionType } from '../types';
import { FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      const data = await db.getInvoices();
      // Map Supabase response (snake_case and joined tables) to Invoice interface
      const mappedInvoices = data.map((inv: any) => ({
        ...inv,
        items: (inv.invoice_items || []).map((item: any) => ({
          ...item,
          name: item.product_name // Map product_name from DB to name for CartItem
        }))
      }));
      setInvoices(mappedInvoices);
    };
    fetchInvoices();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">سجل الفواتير</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4">نوع</th>
                <th className="p-4">الطرف</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">الأصناف</th>
                <th className="p-4">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded text-xs font-bold ${inv.type === TransactionType.SALE ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {inv.type === TransactionType.SALE ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      {inv.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{inv.partner_name}</td>
                  <td className="p-4 text-sm text-gray-500">{inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : '-'}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {inv.items.map(i => i.name).join(', ').substring(0, 30)}...
                  </td>
                  <td className="p-4 font-bold">{inv.final_amount.toLocaleString()} ج.م</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                  <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                          <FileText size={48} className="mx-auto mb-2 opacity-20" />
                          لم يتم تسجيل فواتير بعد
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;