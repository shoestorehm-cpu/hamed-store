import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  Users, 
  FileText, 
  Menu, 
  X,
  Footprints
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'نقطة بيع (فاتورة)', path: '/pos', icon: <ShoppingCart size={20} /> },
    { name: 'المنتجات / المخزون', path: '/products', icon: <ShoppingBag size={20} /> },
    { name: 'العملاء والموردين', path: '/partners', icon: <Users size={20} /> },
    { name: 'سجل الفواتير', path: '/invoices', icon: <FileText size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-30 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          right-0
        `}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-brand-100 p-2 rounded-full text-brand-600">
               <Footprints size={24} />
             </div>
             <div>
               <h1 className="text-xl font-bold text-gray-800">رنة خلخال</h1>
               <p className="text-xs text-brand-600">للمصنوعات الجلدية</p>
             </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive(item.path) 
                  ? 'bg-brand-50 text-brand-700 font-bold border-r-4 border-brand-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t text-center text-xs text-gray-400">
          v1.0.0 - نسخة مجانية
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-800">رنة خلخال</span>
          <div className="w-6"></div> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;