import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Store, Package, DollarSign, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import SEO from './SEO';

type VendorProfile = {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  commission_rate: number;
  status: 'pending' | 'active' | 'suspended';
  total_sales: number;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
};

type Product = {
  id: string;
  name: string;
  price: number;
  status: string;
  vendor_profiles: {
    store_name: string;
  };
};

type OrderSummary = {
  total_orders: number;
  total_revenue: number;
  total_commission: number;
};

type AdminOrder = {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: 'cod' | 'card' | null;
  payment_status: 'unpaid' | 'paid' | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
};

export default function AdminPanel() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    total_orders: 0,
    total_revenue: 0,
    total_commission: 0,
  });
  const [activeTab, setActiveTab] = useState<'vendors' | 'products' | 'overview'>('overview');
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: vendorsData } = await supabase
      .from('vendor_profiles')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false });

    if (vendorsData) setVendors(vendorsData as any);

    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, status, vendor_profiles(store_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (productsData) setProducts(productsData as any);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('total_amount');

    const { data: orderItemsData } = await supabase
      .from('order_items')
      .select('commission_amount, vendor_amount');

    if (ordersData && orderItemsData) {
      const totalRevenue = ordersData.reduce((sum, order) => sum + order.total_amount, 0);
      const totalCommission = orderItemsData.reduce((sum, item) => sum + item.commission_amount, 0);

      setOrderSummary({
        total_orders: ordersData.length,
        total_revenue: totalRevenue,
        total_commission: totalCommission,
      });
    }
  };

  const loadOrdersList = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id,buyer_id,total_amount,status,payment_method,payment_status,created_at,profiles(full_name,email)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setOrdersList(data as any);
  };

  useEffect(() => {
    if (activeTab === 'overview') return;
    if (activeTab === 'products') return;
    // when switching to vendors, we already have data
    // when switching to orders, load list
    if ((activeTab as any) === 'orders') {
      loadOrdersList();
    }
  }, [activeTab]);

  const updateOrderStatus = async (orderId: string, status: AdminOrder['status']) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrdersList((list) => list.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const updateVendorStatus = async (vendorId: string, status: 'active' | 'suspended') => {
    await supabase
      .from('vendor_profiles')
      .update({ status })
      .eq('id', vendorId);

    loadData();
  };

  const updateCommissionRate = async (vendorId: string, rate: number) => {
    await supabase
      .from('vendor_profiles')
      .update({ commission_rate: rate })
      .eq('id', vendorId);

    loadData();
  };

  const pendingVendors = vendors.filter((v) => v.status === 'pending');
  const activeVendors = vendors.filter((v) => v.status === 'active');

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Admin Panel – MarketHub"
        description="Oversee vendors, products, and platform metrics in the MarketHub admin panel."
        canonical="https://www.markethub.example/admin"
        url="https://www.markethub.example/admin"
        image="/og-cover.png"
      />
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-600 mt-1">Manage your marketplace platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders' as any)}
            className={`pb-3 px-4 font-medium transition ${
              (activeTab as any) === 'orders'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'vendors'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vendors
            {pendingVendors.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingVendors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'products'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Store className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Vendors</p>
                    <p className="text-2xl font-bold text-slate-900">{vendors.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ${orderSummary.total_revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <TrendingUp className="text-amber-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Platform Commission</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ${orderSummary.total_commission.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Package className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Orders</p>
                    <p className="text-2xl font-bold text-slate-900">{orderSummary.total_orders}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Vendor Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-900">Active Vendors</span>
                    <span className="text-2xl font-bold text-green-600">{activeVendors.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-yellow-900">Pending Approval</span>
                    <span className="text-2xl font-bold text-yellow-600">{pendingVendors.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-red-900">Suspended</span>
                    <span className="text-2xl font-bold text-red-600">
                      {vendors.filter((v) => v.status === 'suspended').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Platform Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Total Products</span>
                    <span className="text-2xl font-bold text-slate-900">{products.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Avg Commission</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {orderSummary.total_orders > 0
                        ? `$${(orderSummary.total_commission / orderSummary.total_orders).toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Avg Order Value</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {orderSummary.total_orders > 0
                        ? `$${(orderSummary.total_revenue / orderSummary.total_orders).toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="space-y-6">
            {pendingVendors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="text-yellow-600" />
                  Pending Approval
                </h3>
                <div className="space-y-4">
                  {pendingVendors.map((vendor) => (
                    <div key={vendor.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-lg">{vendor.store_name}</h4>
                          <p className="text-sm text-slate-600">{vendor.profiles.email}</p>
                          <p className="text-sm text-slate-500 mt-1">{vendor.store_description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateVendorStatus(vendor.id, 'active')}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                          >
                            <CheckCircle size={18} />
                            Approve
                          </button>
                          <button
                            onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                          >
                            <XCircle size={18} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Store className="text-blue-600" />
                All Vendors
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Store Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Commission Rate</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Total Sales</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium">{vendor.store_name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{vendor.profiles.email}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={vendor.commission_rate}
                            onChange={(e) => updateCommissionRate(vendor.id, parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 border border-slate-300 rounded"
                            step="0.1"
                            min="0"
                            max="100"
                          />
                          <span className="ml-1 text-sm text-slate-600">%</span>
                        </td>
                        <td className="py-3 px-4 text-slate-900">${vendor.total_sales.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              vendor.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : vendor.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {vendor.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {vendor.status !== 'suspended' ? (
                            <button
                              onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => updateVendorStatus(vendor.id, 'active')}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(activeTab as any) === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="text-blue-600" />
              Orders Activity
            </h3>
            {ordersList.length === 0 ? (
              <div className="text-center py-8 text-slate-600">No orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Buyer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Total</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Payment</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Placed</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-600">{o.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{o.profiles?.full_name || 'Buyer'}</div>
                          <div className="text-xs text-slate-600">{o.profiles?.email}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">${o.total_amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm capitalize">{o.payment_method || 'cod'} ({o.payment_status || 'unpaid'})</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            o.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : o.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : o.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>{o.status}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{new Date(o.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => updateOrderStatus(o.id, 'processing')} className="text-blue-600 hover:text-blue-800 text-sm">Processing</button>
                            <button onClick={() => updateOrderStatus(o.id, 'completed')} className="text-green-600 hover:text-green-800 text-sm">Complete</button>
                            <button onClick={() => updateOrderStatus(o.id, 'cancelled')} className="text-red-600 hover:text-red-800 text-sm">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="text-blue-600" />
              All Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Product Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Vendor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {product.vendor_profiles.store_name}
                      </td>
                      <td className="py-3 px-4 text-slate-900">${product.price.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : product.status === 'draft'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


