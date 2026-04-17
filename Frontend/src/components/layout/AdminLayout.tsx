import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/customers', icon: Users, label: 'Customers' },
  { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-400 text-slate-900 rounded-xl flex items-center justify-center shadow-sm font-bold text-xl">
            S
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold tracking-wider text-slate-900">SENSUS PERFUME</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Admin Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'group flex items-center gap-4 px-5 py-3.5 rounded-xl transition-colors duration-200 border border-transparent',
                isActive
                  ? 'bg-amber-400 text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform flex-shrink-0',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )}
              />
              <span className="font-semibold text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-slate-200 space-y-3 shrink-0">
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">Logged in as</p>
          <p className="text-sm font-semibold text-slate-900 truncate">{user?.email ?? 'Admin'}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 rounded-xl py-6"
          onClick={() => navigate('/')}
        >
          <Home className="w-5 h-5 mr-3" />
          <span className="font-medium">Back to Store</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl py-6"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar - Fixed and Full Height */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 shadow-sm z-50 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Header with Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-400 text-slate-900 rounded-lg flex items-center justify-center font-bold text-lg">
            S
          </div>
          <h1 className="font-display font-bold text-lg text-slate-900">SENSUS</h1>
        </div>
        
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-white">
            <div className="h-full overflow-y-auto">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area - with left margin to account for fixed sidebar */}
      <main className="flex-1 md:ml-72 h-screen overflow-y-auto pt-16 md:pt-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
