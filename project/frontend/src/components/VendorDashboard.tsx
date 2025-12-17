import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Package, Plus, Edit2, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import SEO from './SEO';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string;
  image_url: string | null;
  status: 'draft' | 'active' | 'out_of_stock';
  meta_title?: string | null;
  meta_description?: string | null;
  meta_image_url?: string | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  commission_amount: number;
  vendor_amount: number;
  created_at: string;
  products: {
    name: string;
  };
};

export default function VendorDashboard() {
  const { vendorProfile, profile, refreshProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showStoreSetup, setShowStoreSetup] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    image_url: '',
    status: 'active' as 'draft' | 'active' | 'out_of_stock',
    meta_title: '',
    meta_description: '',
    meta_image_url: '',
  });

  useEffect(() => {
    if (vendorProfile) {
      loadProducts();
      loadOrders();
    } else if (profile?.role === 'vendor') {
      setShowStoreSetup(true);
    }
    setLoading(false);
  }, [vendorProfile]);

  const loadProducts = async () => {
    if (!vendorProfile) return;

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorProfile.id)
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
  };

  const loadOrders = async () => {
    if (!vendorProfile) return;

    const { data } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('vendor_id', vendorProfile.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as any);
  };

  const createVendorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const { error } = await supabase.from('vendor_profiles').insert({
      user_id: profile.id,
      store_name: storeName,
      store_description: storeDescription,
    });

    if (!error) {
      await refreshProfile();
      setShowStoreSetup(false);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorProfile) return;

    const generatedMetaTitle = `${productForm.name} | ${vendorProfile.store_name}`;
    const generatedMetaDescription = (productForm.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155);
    const productData = {
      ...productForm,
      meta_title: productForm.meta_title?.trim() || generatedMetaTitle,
      meta_description: productForm.meta_description?.trim() || generatedMetaDescription,
      meta_image_url: productForm.meta_image_url?.trim() || productForm.image_url || '',
      price: parseFloat(productForm.price),
      stock_quantity: parseInt(productForm.stock_quantity),
      vendor_id: vendorProfile.id,
    };

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert(productData);
    }

    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      category: '',
      image_url: '',
      status: 'active',
      meta_title: '',
      meta_description: '',
      meta_image_url: '',
    });
    loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      loadProducts();
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      category: product.category,
      image_url: product.image_url || '',
      status: product.status,
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      meta_image_url: product.meta_image_url || '',
    });
    setShowProductForm(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (showStoreSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Setup Your Store</h2>
          <form onSubmit={createVendorProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Store Description
              </label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
            >
              Create Store
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!vendorProfile) {
    return <div className="flex items-center justify-center h-screen">Setting up vendor profile...</div>;
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.vendor_amount, 0);
  const totalCommissions = orders.reduce((sum, order) => sum + order.commission_amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={`${vendorProfile.store_name} – Vendor Dashboard | MarketHub`}
        description="Manage your products, inventory, and orders in your MarketHub vendor dashboard."
        canonical="https://www.markethub.example/vendor"
        url="https://www.markethub.example/vendor"
        image="/og-cover.png"
      />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{vendorProfile.store_name}</h1>
          <p className="text-slate-600">Vendor Dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingUp className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Platform Commissions</p>
                <p className="text-2xl font-bold text-slate-900">${totalCommissions.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Products</p>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Products</h2>
            <button
              onClick={() => setShowProductForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No products yet. Add your first product to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="h-48 bg-slate-100 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={48} className="text-slate-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-slate-900">${product.price}</span>
                      <span className="text-sm text-slate-600">Stock: {product.stock_quantity}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-slate-600">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Commission</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Your Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100">
                      <td className="py-3 px-4">{order.products.name}</td>
                      <td className="py-3 px-4">{order.quantity}</td>
                      <td className="py-3 px-4">${order.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-red-600">${order.commission_amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">${order.vendor_amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Electronics, Clothing, Books"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {/* SEO meta is generated automatically from product fields. */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      description: '',
                      price: '',
                      stock_quantity: '',
                      category: '',
                      image_url: '',
                      status: 'active',
                      meta_title: '',
                      meta_description: '',
                      meta_image_url: '',
                    });
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


