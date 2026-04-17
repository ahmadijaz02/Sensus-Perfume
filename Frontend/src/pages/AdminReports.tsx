import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ordersAPI, productsAPI } from '@/lib/api';
import { Order } from '@/types/product';
import { BarChart3, TrendingUp, Package, DollarSign, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface ProductSales {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  orders: number;
}

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  totalOriginalRevenue: number;
  totalProducts: number;
  avgOrderValue: number;
  productSales: ProductSales[];
  dailySales: { date: string; revenue: number; orders: number }[];
}

const getDiscountedUnit = (item: any) => {
  const base = Number(item.price || item.variant?.price || 0);
  const globalDiscount = Number(item.globalDiscount || 0);
  const productDiscount = Number(item.productDiscount || 0);

  let discounted = base;

  if (globalDiscount > 0) {
    discounted = base * (1 - globalDiscount / 100);
  } else if (productDiscount > 0) {
    discounted = base * (1 - productDiscount / 100);
  }

  return Math.round(discounted);
};

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData>({
    totalOrders: 0,
    totalRevenue: 0,
    totalOriginalRevenue: 0,
    totalProducts: 0,
    avgOrderValue: 0,
    productSales: [],
    dailySales: []
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      calculateReport();
    } else {
      // Reset report data when no orders
      setReportData({
        totalOrders: 0,
        totalRevenue: 0,
        totalOriginalRevenue: 0,
        totalProducts: 0,
        avgOrderValue: 0,
        productSales: [],
        dailySales: []
      });
    }
  }, [orders, timeFilter, customStartDate, customEndDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error: any) {
      console.error('Orders fetch error:', error);
      toast.error('Unable to load orders data.');
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByTime = (orders: Order[]): Order[] => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      switch (timeFilter) {
        case 'today':
          return orderDate >= startOfToday;
        case 'week':
          return orderDate >= startOfWeek;
        case 'month':
          return orderDate >= startOfMonth;
        case 'year':
          return orderDate >= startOfYear;
        case 'custom':
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            return orderDate >= start && orderDate <= end;
          }
          return true;
        case 'all':
        default:
          return true;
      }
    });
  };

  const calculateReport = () => {
    const filteredOrders = filterOrdersByTime(orders);
    
    console.log('📊 Calculating report for', filteredOrders.length, 'orders');
    
    // Early return if no orders
    if (filteredOrders.length === 0) {
      setReportData({
        totalOrders: 0,
        totalRevenue: 0,
        totalOriginalRevenue: 0,
        totalProducts: 0,
        avgOrderValue: 0,
        productSales: [],
        dailySales: []
      });
      return;
    }
    
    // Calculate totals
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalOriginalRevenue = filteredOrders.reduce((sum, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      if (items.length === 0) return sum + (order.total_amount || 0);

      const originalSubtotal = items.reduce((itemSum, item) => {
        const base = Number(item.price || item.variant?.price || 0);
        const quantity = Number(item.quantity || 0);
        return itemSum + base * quantity;
      }, 0);

      return sum + originalSubtotal;
    }, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    console.log('💰 Total Revenue:', totalRevenue, 'from', totalOrders, 'orders');

    // Product-wise sales
    const productMap = new Map<string, ProductSales>();
    const orderProductMap = new Map<string, Set<string>>(); // Track unique orders per product
    
    filteredOrders.forEach(order => {
      if (!order || !order.id) {
        console.warn('⚠️ Order missing id:', order);
        return;
      }
      
      const orderId = order.id;
      
      console.log('Processing order:', orderId, 'with', order.items?.length || 0, 'items');
      
      if (!order.items || !Array.isArray(order.items)) {
        console.warn('⚠️ Order has no items:', orderId);
        return;
      }
      
      order.items.forEach(item => {
        // Try multiple field names for compatibility
        const key = item.product_id || item.productId || (item.product?._id || item.product?.id) || String(item.product) || 'unknown';
        const name = item.name || item.product_name || item.productName || item.product?.name || 'Unknown Product';
        const price = getDiscountedUnit(item);
        const quantity = Number(item.quantity || 0);
        
        console.log('  Item:', name, '- Qty:', quantity, '× Price:', price, '=', price * quantity);
        
        if (productMap.has(key)) {
          const existing = productMap.get(key)!;
          existing.quantity += quantity;
          existing.revenue += price * quantity;
        } else {
          productMap.set(key, {
            productId: key,
            productName: name,
            quantity: quantity,
            revenue: price * quantity,
            orders: 0 // Will be calculated from orderProductMap
          });
          orderProductMap.set(key, new Set());
        }
        
        // Track unique orders for this product
        if (orderId && orderProductMap.has(key)) {
          orderProductMap.get(key)!.add(orderId);
        }
      });
    });
    
    // Update order counts with unique orders per product
    productMap.forEach((product, key) => {
      product.orders = orderProductMap.get(key)?.size || 0;
      console.log('Product:', product.productName, '- Revenue:', product.revenue, 'Orders:', product.orders);
    });

    const productSales = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    // Daily sales (last 30 days for month, last 7 for week, etc.)
    const dailySalesMap = new Map<string, { revenue: number; orders: number }>();
    
    filteredOrders.forEach(order => {
      const dateKey = new Date(order.created_at).toISOString().split('T')[0];
      const orderAmount = Number(order.total_amount || 0);
      
      if (dailySalesMap.has(dateKey)) {
        const existing = dailySalesMap.get(dateKey)!;
        existing.revenue += orderAmount;
        existing.orders += 1;
      } else {
        dailySalesMap.set(dateKey, {
          revenue: orderAmount,
          orders: 1
        });
      }
    });

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setReportData({
      totalOrders,
      totalRevenue,
      totalOriginalRevenue,
      totalProducts: productSales.length,
      avgOrderValue,
      productSales,
      dailySales
    });
  };

  const exportReport = () => {
    const csvContent = [
      ['Sales Report', `Period: ${timeFilter}`],
      [],
      ['Summary'],
      ['Total Orders', reportData.totalOrders],
      ['Subtotal (Original)', `PKR ${reportData.totalOriginalRevenue.toFixed(2)}`],
      ['Total (Paid)', `PKR ${reportData.totalRevenue.toFixed(2)}`],
      ['Average Order Value', `PKR ${reportData.avgOrderValue.toFixed(2)}`],
      ['Products Sold', reportData.totalProducts],
      [],
      ['Product-wise Sales'],
      ['Product Name', 'Quantity Sold', 'Revenue', 'Number of Orders'],
      ...reportData.productSales.map(p => [
        p.productName,
        p.quantity,
        `PKR ${p.revenue.toFixed(2)}`,
        p.orders
      ]),
      [],
      ['Daily Sales'],
      ['Date', 'Revenue', 'Orders'],
      ...reportData.dailySales.map(d => [
        d.date,
        `PKR ${d.revenue.toFixed(2)}`,
        d.orders
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${timeFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
      case 'custom': 
        if (customStartDate && customEndDate) {
          return `${new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return 'Custom Range';
      default: return '';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sales Reports</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Analyze your sales performance and trends
            </p>
          </div>
          
          <div className="flex flex-col gap-3 bg-card border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="text-xs font-medium mb-1.5 block">Time Period</Label>
                <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">📅 Today</SelectItem>
                    <SelectItem value="week">📆 This Week</SelectItem>
                    <SelectItem value="month">🗓️ This Month</SelectItem>
                    <SelectItem value="year">📊 This Year</SelectItem>
                    <SelectItem value="custom">🔍 Custom Range</SelectItem>
                    <SelectItem value="all">∞ All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={exportReport} variant="outline" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {timeFilter === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date" className="text-xs font-medium">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-date" className="text-xs font-medium">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Subtotal (Original)</div>
              <div className="text-xl md:text-2xl font-bold">
                PKR {reportData.totalOriginalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Total (Paid)</div>
              <div className="text-lg md:text-xl font-bold text-green-600">
                PKR {reportData.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getTimeFilterLabel()}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{reportData.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {getTimeFilterLabel()}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                PKR {reportData.avgOrderValue.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per order
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Products Sold</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{reportData.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Different products
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product-wise Sales */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl">Product-wise Sales</CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">
                  Sales breakdown by product ({getTimeFilterLabel()})
                </CardDescription>
              </div>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reportData.productSales.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No sales data available</p>
                <p className="text-sm text-muted-foreground mt-1">Try selecting a different time period</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">#</th>
                        <th className="text-left p-4 font-semibold text-sm">Product Name</th>
                        <th className="text-right p-4 font-semibold text-sm">Quantity</th>
                        <th className="text-right p-4 font-semibold text-sm">Revenue</th>
                        <th className="text-right p-4 font-semibold text-sm">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.productSales.map((product, idx) => (
                        <tr key={product.productId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {idx + 1}
                            </div>
                          </td>
                          <td className="p-4 font-medium">{product.productName}</td>
                          <td className="p-4 text-right font-semibold">{product.quantity}</td>
                          <td className="p-4 text-right font-bold text-green-600">
                            PKR {product.revenue.toLocaleString()}
                          </td>
                          <td className="p-4 text-right text-muted-foreground">{product.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {reportData.productSales.map((product, idx) => (
                    <div key={product.productId} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm break-words">{product.productName}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm pt-3 border-t">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Qty</div>
                          <div className="font-bold text-base">{product.quantity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Revenue</div>
                          <div className="font-bold text-sm text-green-600">
                            {product.revenue.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Orders</div>
                          <div className="font-bold text-base">{product.orders}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Daily Sales Trend */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl">Sales Trend</CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">
                  Daily revenue and orders ({getTimeFilterLabel()})
                </CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reportData.dailySales.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No daily sales data</p>
                <p className="text-sm text-muted-foreground mt-1">Sales data will appear here once orders are placed</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Date</th>
                        <th className="text-right p-4 font-semibold text-sm">Revenue</th>
                        <th className="text-right p-4 font-semibold text-sm">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.dailySales.map((day) => (
                        <tr key={day.date} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {new Date(day.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-green-600">
                            PKR {day.revenue.toLocaleString()}
                          </td>
                          <td className="p-4 text-right text-muted-foreground font-semibold">{day.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {reportData.dailySales.map((day) => (
                    <div key={day.date} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-medium text-sm">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Revenue</div>
                          <div className="font-bold text-base text-green-600">
                            PKR {day.revenue.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">Orders</div>
                          <div className="font-bold text-base">{day.orders}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
