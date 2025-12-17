import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Partner } from '../types';
import { Plus, Trash2, Phone, User, Wallet } from 'lucide-react';

const Partners: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'customer' | 'supplier'>('customer');
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const data = await db.getPartners();
    setPartners(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    await db.savePartner({ ...formData, type, balance: 0 });
    setFormData({ name: '', phone: '' });
    fetchPartners();
  };

  const handleDelete = async (id: string) => {
    if (confirm('حذف هذا السجل؟')) {
      await db.deletePartner(id);
      fetchPartners();
    }
  };

  const filtered = partners.filter(p => p.type === type);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">العملاء والموردين</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-brand-700">
            <Plus size={20} />
            إضافة جديد
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-4 flex-wrap items-end">
           <div className="flex-1 min-w-[200px]">
             <label className="block text-sm text-gray-600 mb-1">الاسم</label>
             <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2" placeholder="الاسم بالكامل" />
           </div>
           <div className="flex-1 min-w-[200px]">
             <label className="block text-sm text-gray-600 mb-1">الهاتف</label>
             <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg p-2" placeholder="01xxxxxxxxx" />
           </div>
           <div className="flex-1 min-w-[150px]">
             <label className="block text-sm text-gray-600 mb-1">النوع</label>
             <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border rounded-lg p-2">
               <option value="customer">عميل</option>
               <option value="supplier">مورد</option>
             </select>
           </div>
           <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900">حفظ</button>
        </form>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setType('customer')} className={`px-4 py-2 rounded-lg ${type === 'customer' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600'}`}>العملاء</button>
        <button onClick={() => setType('supplier')} className={`px-4 py-2 rounded-lg ${type === 'supplier' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600'}`}>الموردين</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p>جاري التحميل...</p> : filtered.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-3 rounded-full text-gray-500">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">{p.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone size={14} />
                        <span>{p.phone || 'لا يوجد هاتف'}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => handleDelete(p.id!)} className="text-red-400 hover:text-red-600 p-2">
                <Trash2 size={18} />
                </button>
            </div>
            
            <div className={`p-3 rounded-lg flex items-center justify-between ${p.balance > 0 ? 'bg-red-50 text-red-700' : p.balance < 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
               <div className="flex items-center gap-2 text-sm">
                 <Wallet size={16} />
                 <span>الرصيد:</span>
               </div>
               <span className="font-bold text-lg" dir="ltr">{Math.abs(p.balance)} ج.م</span>
               <span className="text-xs">
                 {p.balance > 0 ? (type === 'customer' ? 'عليه (مدين)' : 'له (دائن)') : 
                  p.balance < 0 ? (type === 'customer' ? 'له (دائن)' : 'عليه (مدين)') : 'خالص'}
               </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-gray-400 text-center col-span-2 py-8">لا توجد بيانات</p>}
      </div>
    </div>
  );
};

export default Partners;