import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Product, CartItem, TransactionType, Partner } from '../types';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, User, Printer, X, DollarSign } from 'lucide-react';

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.SALE);
  const [discount, setDiscount] = useState(0);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await db.getProducts();
    const ptr = await db.getPartners();
    setProducts(p);
    setPartners(ptr);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.product_id === product.id);
      if (exists) {
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, product_id: product.id!, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product_id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((acc, item) => acc + (transactionType === TransactionType.SALE ? item.price : item.cost) * item.quantity, 0);
    return Math.max(0, subtotal - discount);
  };

  const openPaymentModal = () => {
    setPaidAmount(calculateTotal()); // Default to full payment
    setIsPaymentModalOpen(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const total = calculateTotal();
    const finalAmount = total;
    const remaining = finalAmount - paidAmount;
    
    const partnerName = partners.find(p => p.id === selectedPartner)?.name || 'عميل نقدي';
    
    try {
      const invoice = await db.createInvoice({
        type: transactionType,
        partner_id: selectedPartner || undefined,
        partner_name: partnerName,
        items: cart,
        total_amount: total + discount,
        discount,
        final_amount: finalAmount,
        paid_amount: paidAmount,
        remaining_amount: remaining,
        status: remaining > 0 ? 'partial' : 'paid'
      });

      setLastInvoice(invoice);
      setIsPaymentModalOpen(false);
      
      // Reset
      setCart([]);
      setDiscount(0);
      setSelectedPartner('');
      loadData(); // Refresh stock

      // Auto Print
      setTimeout(() => window.print(), 500);

    } catch (e) {
      alert('حدث خطأ أثناء حفظ الفاتورة');
      console.error(e);
    }
  };

  const filteredProducts = products.filter(p => p.name.includes(search));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-4">
      {/* Product List */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-2">
              <button 
                onClick={() => setTransactionType(TransactionType.SALE)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm ${transactionType === TransactionType.SALE ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                فاتورة بيع
              </button>
              <button 
                onClick={() => setTransactionType(TransactionType.PURCHASE)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm ${transactionType === TransactionType.PURCHASE ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                فاتورة شراء
              </button>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            <input 
              className="w-full pr-10 pl-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-brand-300 hover:shadow-md transition text-center group bg-white"
            >
              {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-20 h-20 mb-2 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-brand-50 text-brand-600">
                    <ShoppingCart size={20} />
                </div>
              )}
              <span className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</span>
              <span className="text-xs text-gray-500 mb-1">{p.category}</span>
              <span className="text-brand-600 font-bold">{transactionType === TransactionType.SALE ? p.price : p.cost} ج.م</span>
              <span className="text-xs text-gray-400 mt-1">مخزون: {p.stock}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Invoice */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        <div className="p-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2 mb-3">
            <User size={18} className="text-gray-500" />
            <select 
              className="w-full bg-white border rounded-lg p-2 text-sm"
              value={selectedPartner}
              onChange={e => setSelectedPartner(e.target.value)}
            >
              <option value="">{transactionType === TransactionType.SALE ? 'عميل نقدي' : 'مورد عام'}</option>
              {partners
                .filter(p => p.type === (transactionType === TransactionType.SALE ? 'customer' : 'supplier'))
                .map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <h3 className="font-bold text-gray-800">تفاصيل الفاتورة</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-20" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-brand-600 font-medium">
                    {transactionType === TransactionType.SALE ? item.price : item.cost} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-white rounded border"><Minus size={14}/></button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-white rounded border"><Plus size={14}/></button>
                  <button onClick={() => removeFromCart(item.product_id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-3 rounded-b-xl">
            <div className="flex justify-between items-center text-sm">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{(calculateTotal() + discount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span>خصم:</span>
                <input 
                    type="number" 
                    value={discount} 
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-20 p-1 border rounded text-center"
                />
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-brand-700 pt-2 border-t border-gray-200">
                <span>الإجمالي:</span>
                <span>{calculateTotal().toLocaleString()} ج.م</span>
            </div>
            
            <button 
                onClick={openPaymentModal}
                disabled={cart.length === 0}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <DollarSign size={20} />
                <span>دفع / طباعة</span>
            </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">تأكيد الدفع</h3>
                <button onClick={() => setIsPaymentModalOpen(false)}><X size={24} /></button>
             </div>
             
             <div className="space-y-4 mb-6">
                <div className="flex justify-between text-lg">
                  <span>الإجمالي المطلوب:</span>
                  <span className="font-bold">{calculateTotal().toLocaleString()} ج.م</span>
                </div>
                
                <div>
                   <label className="block text-sm text-gray-600 mb-1">المبلغ المدفوع</label>
                   <input 
                     type="number" 
                     value={paidAmount} 
                     onChange={e => setPaidAmount(Number(e.target.value))}
                     className="w-full text-xl font-bold p-3 border rounded-xl"
                   />
                </div>

                <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                   <span>المتبقي (آجل/دين):</span>
                   <span className={`font-bold text-lg ${calculateTotal() - paidAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                     {(calculateTotal() - paidAmount).toLocaleString()} ج.م
                   </span>
                </div>
             </div>

             <button 
               onClick={handleCheckout}
               className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 flex items-center justify-center gap-2"
             >
               <Printer size={20} />
               <span>حفظ وطباعة الفاتورة</span>
             </button>
          </div>
        </div>
      )}

      {/* Hidden Print Receipt Template */}
      <div id="invoice-print-area" className="hidden">
        {lastInvoice && (
          <div className="text-center font-sans p-4 border border-black max-w-[300px] mx-auto">
             <h1 className="text-2xl font-bold mb-1">رنة خلخال</h1>
             <p className="text-sm mb-4">أحذية وحقائب حريمي</p>
             <div className="border-b border-black mb-4"></div>
             
             <div className="text-right text-sm mb-4 space-y-1">
                <p><strong>رقم الفاتورة:</strong> {lastInvoice.id?.substring(0,8)}</p>
                <p><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
                <p><strong>العميل:</strong> {lastInvoice.partner_name}</p>
             </div>

             <table className="w-full text-right text-sm mb-4 border-collapse">
                <thead>
                   <tr className="border-b border-black border-dashed">
                     <th className="py-1">الصنف</th>
                     <th className="py-1">العدد</th>
                     <th className="py-1">السعر</th>
                   </tr>
                </thead>
                <tbody>
                  {lastInvoice.items.map((item: any) => (
                    <tr key={item.product_id} className="border-b border-black border-dashed">
                       <td className="py-1">{item.product_name || item.name}</td>
                       <td className="py-1">{item.quantity}</td>
                       <td className="py-1">{item.price}</td>
                    </tr>
                  ))}
                </tbody>
             </table>

             <div className="border-t border-black pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                   <span>الإجمالي:</span>
                   <span>{lastInvoice.final_amount} ج.م</span>
                </div>
                <div className="flex justify-between">
                   <span>المدفوع:</span>
                   <span>{lastInvoice.paid_amount} ج.م</span>
                </div>
                {lastInvoice.remaining_amount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>متبقي (آجل):</span>
                    <span>{lastInvoice.remaining_amount} ج.م</span>
                  </div>
                )}
             </div>
             
             <div className="mt-8 text-center text-xs">
                <p>شكراً لزيارتكم</p>
                <p>سياسة الاستبدال خلال 14 يوم</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;