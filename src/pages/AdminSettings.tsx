import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { settingsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { StoreSettings } from '@/types/settings';
import { useAuth } from '@/hooks/useAuth';

const defaultSettings: StoreSettings = {
  globalDiscountPercent: 0,
  promoCode: '',
  promoDiscountPercent: 0,
  promoDiscountMaxAmount: 0,
  deliveryCost: 0,
  freeDeliveryEnabled: false,
  freeDeliveryMinAmount: 0
};

const AdminSettings = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsAPI.get();
        setSettings({
          globalDiscountPercent: Number(data.globalDiscountPercent ?? 0),
          promoCode: data.promoCode ?? '',
          promoDiscountPercent: Number(data.promoDiscountPercent ?? 0),
          promoDiscountMaxAmount: Number(data.promoDiscountMaxAmount ?? 0),
          deliveryCost: Number(data.deliveryCost ?? 0),
          freeDeliveryEnabled: Boolean(data.freeDeliveryEnabled ?? false),
          freeDeliveryMinAmount: Number(data.freeDeliveryMinAmount ?? 0)
        });
      } catch (error: any) {
        console.error('Settings load error:', error);
        toast.error('Unable to load settings. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        globalDiscountPercent: Number(settings.globalDiscountPercent) || 0,
        promoCode: settings.promoCode.trim(),
        promoDiscountPercent: Number(settings.promoDiscountPercent) || 0,
        promoDiscountMaxAmount: Number(settings.promoDiscountMaxAmount) || 0,
        deliveryCost: Number(settings.deliveryCost) || 0,
        freeDeliveryEnabled: Boolean(settings.freeDeliveryEnabled),
        freeDeliveryMinAmount: Number(settings.freeDeliveryMinAmount) || 0
      };
      console.log('Saving settings payload:', payload);
      await settingsAPI.update(payload);
      toast.success('Store settings updated');
    } catch (error: any) {
      console.error('Settings update error:', error);
      toast.error('Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-slate-50 p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen">
        {/* Header */}
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Store Settings</h2>
          <p className="text-slate-600 mt-2 text-sm md:text-base">Manage pricing, promotions, and delivery configurations</p>
        </div>

        {!isAdmin && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            Admin access required to update these settings.
          </div>
        )}

        {/* Global Discount Card */}
        <Card className="border border-blue-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-blue-200">
            <h3 className="text-xl font-bold text-slate-900">Global Discount</h3>
            <p className="text-sm text-slate-600 mt-1">Apply a store-wide discount to all products</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Discount Percentage (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.globalDiscountPercent}
                onChange={(e) => setSettings((prev) => ({ ...prev, globalDiscountPercent: Number(e.target.value) }))}
                disabled={!isAdmin}
                className="w-full border border-blue-200 bg-white px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., 10"
              />
              <p className="text-xs text-slate-500 mt-2">Set to 0 for no global discount</p>
            </div>
          </div>
        </Card>

        {/* Promo Code Card */}
        <Card className="border border-purple-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-purple-200">
            <h3 className="text-xl font-bold text-slate-900">Promotional Code</h3>
            <p className="text-sm text-slate-600 mt-1">Create and manage promotional offers</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Promo Code</label>
                <input
                  type="text"
                  value={settings.promoCode}
                  onChange={(e) => setSettings((prev) => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                  disabled={!isAdmin}
                  placeholder="e.g., SENSUS10"
                  className="w-full border border-purple-200 bg-white px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
                />
                <p className="text-xs text-slate-500 mt-1">Letters and numbers only (auto-uppercase)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Discount Percentage (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.promoDiscountPercent}
                  onChange={(e) => setSettings((prev) => ({ ...prev, promoDiscountPercent: Number(e.target.value) }))}
                  disabled={!isAdmin}
                  className="w-full border border-purple-200 bg-white px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="e.g., 15"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Maximum Discount Cap (PKR)</label>
              <input
                type="number"
                min={0}
                value={settings.promoDiscountMaxAmount}
                onChange={(e) => setSettings((prev) => ({ ...prev, promoDiscountMaxAmount: Number(e.target.value) }))}
                disabled={!isAdmin}
                className="w-full border border-purple-200 bg-white px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., 500 (set to 0 for unlimited)"
              />
              <p className="text-xs text-slate-500 mt-1">Maximum discount amount customers can receive. Set to 0 for unlimited</p>
            </div>
          </div>
        </Card>

        {/* Delivery Settings Card */}
        <Card className="border border-green-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
            <h3 className="text-xl font-bold text-slate-900">Delivery Configuration</h3>
            <p className="text-sm text-slate-600 mt-1">Set delivery costs and free delivery thresholds</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Standard Delivery Cost */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Delivery Cost (PKR)</label>
              <input
                type="number"
                min={0}
                value={settings.deliveryCost}
                onChange={(e) => setSettings((prev) => ({ ...prev, deliveryCost: Number(e.target.value) }))}
                disabled={!isAdmin}
                className="w-full border border-green-200 bg-white px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., 300"
              />
              <p className="text-xs text-slate-500 mt-1">Standard delivery charge for all orders</p>
            </div>

            {/* Free Delivery Toggle */}
            <div className="border-t border-green-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Enable Free Delivery Offers</label>
                  <p className="text-xs text-slate-500 mt-1">Allow free delivery when customers reach a minimum purchase amount</p>
                </div>
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, freeDeliveryEnabled: !prev.freeDeliveryEnabled }))}
                  disabled={!isAdmin}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.freeDeliveryEnabled
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  } ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.freeDeliveryEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Free Delivery Minimum (Conditional) */}
            {settings.freeDeliveryEnabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Free Delivery Minimum (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.freeDeliveryMinAmount}
                    onChange={(e) => setSettings((prev) => ({ ...prev, freeDeliveryMinAmount: Number(e.target.value) }))}
                    disabled={!isAdmin}
                    className="w-full border border-green-200 bg-white px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., 5000"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum cart value for free delivery to apply</p>
                </div>
                <div className="bg-white border border-green-200 rounded-lg p-3 text-sm">
                  <p className="text-slate-700">
                    <span className="font-semibold">Example:</span> With delivery cost of{' '}
                    <span className="text-orange-600 font-semibold">PKR {settings.deliveryCost || 0}</span> and minimum of{' '}
                    <span className="text-green-600 font-semibold">PKR {settings.freeDeliveryMinAmount || 'amount'}</span>, customers
                    will get <span className="font-semibold">free delivery</span> when their cart reaches the minimum.
                  </p>
                </div>
              </div>
            )}

            {/* Standard Delivery Info */}
            {!settings.freeDeliveryEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-slate-700"><span className="font-semibold">ℹ️ Standard Mode:</span> All orders will include a delivery charge of <span className="text-orange-600 font-semibold">PKR {settings.deliveryCost || 0}</span>.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="sticky bottom-4 md:bottom-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || loading || !isAdmin}
            className="w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl px-6 md:px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
