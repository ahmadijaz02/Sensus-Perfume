import AdminLayout from '@/components/layout/AdminLayout';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ordersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, Eye, Truck } from 'lucide-react';

interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  shipping_address: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-emerald-500/20 text-emerald-600',
  confirmed: 'bg-blue-500/20 text-blue-500',
  processing: 'bg-purple-500/20 text-purple-500',
  shipped: 'bg-cyan-500/20 text-cyan-500',
  delivered: 'bg-green-500/20 text-green-500',
  cancelled: 'bg-red-500/20 text-red-500',
};

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error: any) {
      console.error('Orders fetch error:', error);
      toast.error('Unable to load orders. Please refresh the page.');
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const order = await ordersAPI.getById(orderId);
      setOrderItems(order.items || []);
    } catch (error: any) {
      console.error('Order items fetch error:', error);
      toast.error('Unable to load order details. Please try again.');
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setNotes(order.notes || '');
    await fetchOrderItems(order.id);
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!selectedOrder) return;
    setIsUpdating(true);

    try {
      const updatedOrder = await ordersAPI.updateStatus(selectedOrder.id, newStatus);
      toast.success('Order status updated');
      setSelectedOrder(updatedOrder);
      fetchOrders();
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error('Unable to update status. Please try again.');
    }

    setIsUpdating(false);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);

    try {
      const updatedOrder = await ordersAPI.updateTracking(
        selectedOrder.id,
        trackingNumber || null,
        notes || null
      );
      
      toast.success('Order updated successfully');
      setSelectedOrder(updatedOrder);
      fetchOrders();
    } catch (error: any) {
      console.error('Order update error:', error);
      toast.error('Unable to update order. Please try again.');
    }

    setIsUpdating(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse text-slate-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <main className="bg-white min-h-screen">
        <div className="p-4 md:p-8">
          <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-amber-400" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">Orders Management</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Orders List */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="p-3 md:p-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="font-semibold text-slate-900 text-sm md:text-base">Orders ({orders.length})</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="text-xs md:text-sm font-semibold">Order ID</TableHead>
                        <TableHead className="text-xs md:text-sm font-semibold hidden sm:table-cell">Customer</TableHead>
                        <TableHead className="text-xs md:text-sm font-semibold">Status</TableHead>
                        <TableHead className="text-xs md:text-sm font-semibold hidden md:table-cell">Total</TableHead>
                        <TableHead className="text-xs md:text-sm font-semibold"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-slate-500 py-8 text-sm">
                            No orders yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow
                            key={order.id}
                            className={`border-b border-slate-100 hover:bg-slate-50 ${selectedOrder?.id === order.id ? 'bg-amber-50' : ''}`}
                          >
                            <TableCell className="font-mono text-xs p-3">
                              {order.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm p-3">
                              <div>
                                <p className="font-medium text-slate-900 text-xs md:text-sm">{order.customer_name}</p>
                                <p className="text-xs text-slate-500">{order.customer_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status]}`}>
                                {order.status}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm p-3 text-slate-900 font-medium">
                              ₨{order.total_amount}
                            </TableCell>
                            <TableCell className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Order Detail */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 shadow-sm sticky top-24">
                {selectedOrder ? (
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <h2 className="font-semibold text-slate-900 mb-4 text-base">Order Details</h2>
                      <p className="font-mono text-xs text-slate-500 mb-2">
                        ID: {selectedOrder.id}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 uppercase mb-1">Customer</h3>
                        <p className="text-sm text-slate-900 font-medium">{selectedOrder.customer_name}</p>
                        <p className="text-xs text-slate-500">{selectedOrder.customer_email}</p>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 uppercase mb-1">Shipping Address</h3>
                        <p className="text-xs text-slate-600">{selectedOrder.shipping_address}</p>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">Items</h3>
                        <div className="space-y-1 bg-slate-50 p-2 rounded">
                          {orderItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs">
                              <span className="text-slate-700">{item.product_name} × {item.quantity}</span>
                              <span className="text-slate-900 font-medium">₨{item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-semibold text-slate-900">
                            <span>Total</span>
                            <span>₨{selectedOrder.total_amount}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">Status</h3>
                        <Select
                          value={selectedOrder.status}
                          onValueChange={(value) => handleStatusChange(value as Order['status'])}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Tracking Number
                        </h3>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Enter tracking number"
                          className="w-full bg-white border border-slate-300 px-2 py-1 text-xs rounded focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 uppercase mb-1">Notes</h3>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Internal notes..."
                          rows={2}
                          className="w-full bg-white border border-slate-300 px-2 py-1 text-xs rounded focus:outline-none focus:border-amber-400 resize-none"
                        />
                      </div>

                      <Button
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold"
                        onClick={handleUpdateOrder}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      <Eye className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Select an order to view details</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
};

export default Admin;
