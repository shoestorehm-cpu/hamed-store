import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { DashboardStats } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchases: 0,
    lowStockCount: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    // Load initial data if empty
    const fetchStats = async () => {
      const data = await db.getStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  // Prepare dummy chart data since we don't have historical data in this simple version
  const chartData = [
    { name: 'الأسبوع 1', sales: stats.totalSales * 0.2 },
    { name: 'الأسبوع 2', sales: stats.totalSales * 0.3 },
    { name: 'الأسبوع 3', sales: stats.totalSales * 0.1 },
    { name: 'الأسبوع 4', sales: stats.totalSales * 0.4 },
  ];

  const StatCard = ({ title, value, icon, color, subText }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {subText && <p className="text-xs text-gray-400 mt-2">{subText}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} text-white`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="إجمالي المبيعات" 
          value={`${stats.totalSales.toLocaleString()} ج.م`} 
          icon={<TrendingUp size={24} />} 
          color="bg-emerald-500"
          subText="مبيعات النظام بالكامل"
        />
        <StatCard 
          title="إيرادات هذا الشهر" 
          value={`${stats.monthlyRevenue.toLocaleString()} ج.م`} 
          icon={<Wallet size={24} />} 
          color="bg-brand-500"
          subText="الأداء الحالي"
        />
        <StatCard 
          title="المصروفات / المشتريات" 
          value={`${stats.totalPurchases.toLocaleString()} ج.م`} 
          icon={<TrendingDown size={24} />} 
          color="bg-orange-500"
          subText="تكلفة البضاعة"
        />
        <StatCard 
          title="نواقص المخزون" 
          value={`${stats.lowStockCount} منتج`} 
          icon={<AlertTriangle size={24} />} 
          color="bg-red-500"
          subText="يحتاج لإعادة طلب"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">أداء المبيعات (تقديري)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  cursor={{fill: '#fce7f3'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="sales" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-brand-900 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center items-center text-center">
            <h3 className="text-xl font-bold mb-2">رنة خلخال</h3>
            <p className="text-brand-200 text-sm mb-6">نظام إدارة متكامل للأحذية الحريمي</p>
            <div className="bg-white/10 p-4 rounded-lg w-full mb-2">
              <span className="block text-2xl font-bold">{new Date().toLocaleDateString('ar-EG')}</span>
              <span className="text-sm text-brand-200">التاريخ اليوم</span>
            </div>
            <button 
              onClick={() => window.location.hash = '#/pos'}
              className="w-full bg-white text-brand-900 font-bold py-3 rounded-lg hover:bg-brand-50 transition"
            >
              فاتورة جديدة
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;