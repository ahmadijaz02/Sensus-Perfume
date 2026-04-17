import AdminLayout from '@/components/layout/AdminLayout';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ordersAPI, productsAPI } from '@/lib/api';
import { ShoppingBag, Package, Users, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersData, productsResponse] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
      ]);

      // Handle both new paginated and old response formats
      const productsData = Array.isArray(productsResponse) 
        ? productsResponse 
        : (productsResponse?.data || []);

      const totalRevenue = ordersData.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
      const pendingOrders = ordersData.filter((order: any) => order.status === 'pending').length;

      setStats({
        totalOrders: ordersData.length,
        totalProducts: productsData.length,
        totalRevenue: totalRevenue,
        pendingOrders: pendingOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    color: string;
  }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-slate-600 uppercase tracking-wide font-medium mb-2">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 md:p-4 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="bg-slate-50 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600 text-sm md:text-base">Welcome to your admin dashboard. Here's a quick overview of your business.</p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 md:p-6 h-24 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-slate-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <StatCard 
                icon={ShoppingBag} 
                label="Total Orders" 
                value={stats.totalOrders}
                color="bg-blue-500"
              />
              <StatCard 
                icon={Package} 
                label="Total Products" 
                value={stats.totalProducts}
                color="bg-purple-500"
              />
              <StatCard 
                icon={TrendingUp} 
                label="Total Revenue" 
                value={`₨${stats.totalRevenue.toFixed(2)}`}
                color="bg-green-500"
              />
              <StatCard 
                icon={Users} 
                label="Pending Orders" 
                value={stats.pendingOrders}
                color="bg-amber-500"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Recent Activity */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Navigation</h2>
              <div className="space-y-2">
                <a href="/admin/orders" className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-amber-400 transition-colors text-slate-700 font-medium text-sm">
                  📦 Manage Orders
                </a>
                <a href="/admin/products" className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-amber-400 transition-colors text-slate-700 font-medium text-sm">
                  🧴 Manage Products
                </a>
                <a href="/admin/customers" className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-amber-400 transition-colors text-slate-700 font-medium text-sm">
                  👥 View Customers
                </a>
                <a href="/admin/settings" className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-amber-400 transition-colors text-slate-700 font-medium text-sm">
                  ⚙️ Settings
                </a>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">System Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-slate-600">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Active</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-slate-600">Last Updated</span>
                  <span className="text-slate-900 font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Version</span>
                  <span className="text-slate-900 font-medium">1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
