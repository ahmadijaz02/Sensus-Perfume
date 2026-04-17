import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ordersAPI } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Eye, Truck, Search, Filter, ShoppingBag, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  items?: any[];
}

const formatPKR = (value: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const getDiscountedUnit = (item: any) => {
  const base = Number(item.price || 0);
  const globalDiscount = Number(item.globalDiscount || 0);
  const productDiscount = Number(item.productDiscount || 0);

  let discounted = base;
  let discountLabel = '';

  if (globalDiscount > 0) {
    discounted = base * (1 - globalDiscount / 100);
    discountLabel = `Global ${globalDiscount}%`;
  } else if (productDiscount > 0) {
    discounted = base * (1 - productDiscount / 100);
    discountLabel = `Product ${productDiscount}%`;
  }

  return {
    discountedUnit: Math.round(discounted),
    discountLabel,
  };
};

const getOrderOriginalSubtotal = (order: Order) => {
  if (!order.items || order.items.length === 0) return order.total_amount;

  return order.items.reduce((sum, item) => {
    const price = Number(item.price || item.variant?.price || 0);
    const quantity = Number(item.quantity || 0);
    return sum + price * quantity;
  }, 0);
};

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-emerald-100 text-emerald-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminOrders = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

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

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error: any) {
      console.error('Orders fetch error:', error);
      toast.error('Unable to load orders. Please refresh the page.');
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setNotes(order.notes || '');
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      setIsUpdating(true);
      await ordersAPI.delete(orderToDelete.id);

      setOrders(orders.filter(o => o.id !== orderToDelete.id));
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
      toast.success('Order deleted successfully');
    } catch (error: any) {
      console.error('Order delete error:', error);
      toast.error('Unable to delete order. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!selectedOrder) return;
    setIsUpdating(true);

    try {
      await ordersAPI.updateStatus(selectedOrder.id, newStatus);
      toast.success('Order status updated');
      fetchOrders();
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error('Unable to update status. Please try again.');
    }

    setIsUpdating(false);
  };

  const handleUpdateTracking = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);

    try {
      await ordersAPI.updateTracking(
        selectedOrder.id,
        trackingNumber || null,
        notes || null
      );
      
      toast.success('Order updated successfully');
      fetchOrders();
      setSelectedOrder({
        ...selectedOrder,
        tracking_number: trackingNumber || null,
        notes: notes || null,
      });
    } catch (error: any) {
      console.error('Order update error:', error);
      toast.error('Unable to update order. Please try again.');
    }

    setIsUpdating(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="bg-white p-4 md:p-8 space-y-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Orders</h2>
            <p className="text-slate-600 mt-2 text-sm md:text-base">Track and manage customer orders</p>
          </div>
          <Button 
            onClick={fetchOrders}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            <Filter className="w-4 h-4 mr-2" />
            Refresh Orders
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 md:p-6 border border-blue-100 shadow-sm bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-semibold text-slate-900 mb-2 block">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-amber-500 focus:ring-amber-500 rounded-lg bg-white text-slate-900 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-900 mb-2 block">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-amber-500 focus:ring-amber-500 rounded-lg bg-white text-slate-900 [&>span]:text-slate-900">
                    <SelectValue placeholder="All Orders" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900">
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2.5 rounded-lg border border-blue-200 w-full text-center">
                {filteredOrders.length} orders
              </div>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="border border-blue-100 shadow-sm bg-white overflow-hidden rounded-xl">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <TableRow>
                  <TableHead className="text-slate-700 font-semibold">Order ID</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Customer</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Products</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Total</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Date</TableHead>
                  <TableHead className="text-right text-slate-700 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <ShoppingBag className="w-12 h-12 mx-auto text-blue-300 mb-3 opacity-50" />
                      <p>No orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-mono text-sm text-slate-900">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{order.customer_name}</p>
                          <p className="text-sm text-slate-500">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-slate-900">
                                {item.product_name || item.productName || item.name} {item.quantity > 1 && `(x${item.quantity})`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span>{formatPKR(order.total_amount)}</span>
                          {Math.round(getOrderOriginalSubtotal(order)) !== Math.round(order.total_amount) && (
                            <span className="text-xs text-slate-500">
                              Subtotal: {formatPKR(getOrderOriginalSubtotal(order))}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            className="bg-blue-100 text-blue-600 hover:bg-blue-200 font-semibold rounded-lg"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteClick(order)}
                            className="bg-red-100 text-red-600 hover:bg-red-200 font-semibold rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto text-blue-300 mb-3 opacity-50" />
                <p className="text-slate-500">No orders found</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="p-4 border border-blue-100 bg-blue-50/30">
                  <div className="space-y-3">
                    {/* Order ID and Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Order ID</p>
                        <p className="font-mono text-sm font-semibold text-slate-900">{order.id.substring(0, 12)}...</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {/* Customer */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer</p>
                      <p className="font-semibold text-slate-900 text-sm">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">{order.customer_email}</p>
                    </div>

                    {/* Products */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Products</p>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-sm text-slate-900">
                              {item.product_name || item.productName || item.name} {item.quantity > 1 && `(x${item.quantity})`}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amount and Date */}
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <div>
                        <p className="text-xs text-slate-500">Amount</p>
                        <p className="font-bold text-slate-900">{formatPKR(order.total_amount)}</p>
                        {Math.round(getOrderOriginalSubtotal(order)) !== Math.round(order.total_amount) && (
                          <p className="text-xs text-slate-500">Subtotal: {formatPKR(getOrderOriginalSubtotal(order))}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Date</p>
                        <p className="text-sm text-slate-700">{new Date(order.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: '2-digit' })}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="flex-1 bg-blue-100 text-blue-600 hover:bg-blue-200 font-semibold rounded-lg text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteClick(order)}
                        className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 font-semibold rounded-lg text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-700 font-semibold">Customer</Label>
                    <p className="font-medium text-slate-900">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-slate-600">{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-700 font-semibold">Order ID</Label>
                    <p className="font-mono text-sm text-slate-900">{selectedOrder.id}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <Label className="text-sm text-slate-700 font-semibold">Shipping Address</Label>
                  <p className="text-sm mt-1 text-slate-900">{selectedOrder.shipping_address}</p>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-500 mb-2 block">Order Items</Label>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item: any, index: number) => {
                        const { discountedUnit, discountLabel } = getDiscountedUnit(item);
                        const unitPrice = Number(item.price || 0);
                        const quantity = Number(item.quantity || 0);

                        return (
                          <div key={index} className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                              <p className="font-medium text-slate-900">{item.product_name}</p>
                              <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                              {discountLabel && (
                                <p className="text-xs text-green-600">{discountLabel}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {discountedUnit !== unitPrice && (
                                <p className="text-xs text-slate-400 line-through">
                                  {formatPKR(unitPrice)}
                                </p>
                              )}
                              <p className="font-semibold text-blue-600">
                                {formatPKR(discountedUnit)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Line: {formatPKR(discountedUnit * quantity)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-700">Subtotal (Original)</span>
                        <div className="text-sm text-slate-600">
                          {formatPKR(getOrderOriginalSubtotal(selectedOrder))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-700">Total (Paid)</span>
                        <div className="text-xl font-bold text-blue-600">{formatPKR(selectedOrder.total_amount)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div>
                    <Label className="text-slate-700 font-semibold">Order Status</Label>
                  <Select value={selectedOrder.status} onValueChange={(value) => handleStatusChange(value as Order['status'])}>
                      <SelectTrigger className="mt-2 bg-white text-slate-900 border-slate-300 focus:border-amber-500 [&>span]:text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-slate-900">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tracking Number */}
                <div>
                  <Label className="text-slate-700 font-semibold">Tracking Number</Label>
                  <div className="flex gap-2 mt-2">
                    <Truck className="w-5 h-5 text-slate-400 mt-2" />
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="bg-white text-slate-900 placeholder:text-slate-500 border-slate-300 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-slate-700 font-semibold">Admin Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes here"
                    rows={3}
                    className="mt-2 bg-white text-slate-900 placeholder:text-slate-500 border-slate-300 focus:border-amber-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTracking} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700">
                    {isUpdating ? 'Updating...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900">Delete Order</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-slate-600">
                  <p>Are you sure you want to delete this order? This action cannot be undone.</p>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-1">
                    <p className="font-semibold text-slate-900">Order ID: {orderToDelete?.id.substring(0, 12)}...</p>
                    <p className="text-sm text-slate-700">Customer: {orderToDelete?.customer_name}</p>
                    <p className="text-sm text-slate-700">Amount: PKR {orderToDelete?.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel className="bg-slate-100 text-slate-900 hover:bg-slate-200 font-semibold">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                disabled={isUpdating}
                className="bg-red-600 text-white hover:bg-red-700 font-semibold"
              >
                {isUpdating ? 'Deleting...' : 'Delete Order'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
