import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { supabase, uploadImage } from '../lib/supabase';
import { Product } from '../types';
import { Plus, Trash2, Edit, Search, Package, Image as ImageIcon, Upload } from 'lucide-react';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: '', price: 0, cost: 0, stock: 0, min_stock: 2, image_url: ''
  });

  useEffect(() => {
    refreshProducts();
  }, []);

  const refreshProducts = async () => {
    try {
      setLoading(true);
      const data = await db.getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploading(true);
      const file = e.target.files[0];
      const url = await uploadImage(file);
      setFormData({ ...formData, image_url: url });
    } catch (error) {
      alert('فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    
    try {
      await db.saveProduct(formData as Product);
      setIsOpen(false);
      setFormData({ name: '', category: '', price: 0, cost: 0, stock: 0, min_stock: 2, image_url: '' });
      refreshProducts();
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (p: Product) => {
    setFormData(p);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await db.deleteProduct(id);
      refreshProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(search) || p.category.includes(search)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">إدارة المنتجات والمخزون</h2>
        <button 
          onClick={() => { setFormData({}); setIsOpen(true); }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition"
        >
          <Plus size={20} />
          <span>منتج جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex gap-3">
            <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="بحث عن منتج..." 
                    className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? <p className="p-8 text-center">جاري التحميل...</p> : (
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600 font-semibold">
              <tr>
                <th className="p-4">صورة</th>
                <th className="p-4">اسم المنتج</th>
                <th className="p-4">القسم</th>
                <th className="p-4">سعر التكلفة</th>
                <th className="p-4">سعر البيع</th>
                <th className="p-4">المخزون</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-sm text-gray-500">{p.category}</td>
                  <td className="p-4">{p.cost}</td>
                  <td className="p-4 font-bold text-brand-600">{p.price}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.stock <= p.min_stock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                  <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                          <Package size={48} className="mx-auto mb-2 opacity-20" />
                          لا توجد منتجات مطابقة
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Image Upload */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="text-sm text-gray-500">اضغط لرفع صورة للمنتج</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              {uploading && <p className="text-xs text-blue-500 text-center">جاري رفع الصورة...</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                    <input list="categories" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg p-2" />
                    <datalist id="categories">
                        <option value="أحذية كعب عالي" />
                        <option value="صنادل" />
                        <option value="رياضي" />
                        <option value="حقائب" />
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حد المخزون الأدنى</label>
                    <input type="number" value={formData.min_stock || 0} onChange={e => setFormData({...formData, min_stock: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة (شراء)</label>
                    <input type="number" required value={formData.cost || 0} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر (بيع)</label>
                    <input type="number" required value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المخزون الحالي</label>
                    <input type="number" required value={formData.stock || 0} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={uploading} className="flex-1 bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">حفظ</button>
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;