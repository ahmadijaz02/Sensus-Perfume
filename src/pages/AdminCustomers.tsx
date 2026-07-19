import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Users, TrendingUp, Award, Zap } from 'lucide-react';

const AdminCustomers = () => {
  return (
    <AdminLayout>
      <div className="bg-white p-4 md:p-8 space-y-8 min-h-screen">
        {/* Header */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Customers</h2>
          <p className="text-slate-600 mt-2 text-sm md:text-base">Manage and analyze your customer relationships</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group relative overflow-hidden bg-white border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-emerald-600">Coming Soon</p>
          </Card>

          <Card className="group relative overflow-hidden bg-white border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lifetime Value</p>
            <p className="text-3xl font-bold text-blue-600">PKR 0</p>
          </Card>

          <Card className="group relative overflow-hidden bg-white border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Loyal Customers</p>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </Card>

          <Card className="group relative overflow-hidden bg-white border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active This Month</p>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="p-12 text-center border border-emerald-200 bg-white rounded-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Advanced Customer Analytics</h3>
          <p className="text-slate-600 max-w-lg mx-auto mb-6">
            Full customer management features including profiles, purchase history, loyalty tracking, and personalized recommendations coming soon.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="px-4 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-600">
              📊 Customer Profiles
            </div>
            <div className="px-4 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-600">
              💳 Purchase History
            </div>
            <div className="px-4 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-600">
              ⭐ Loyalty Program
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
