import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Package, Plus, Minus, Search, Filter, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from './SEO';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string;
  image_url: string | null;
  vendor_id: string;
  vendor_profiles: {
    store_name: string | null;
  } | null;
};

type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  products: Product;
};

export default function Marketplace() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostal, setShippingPostal] = useState('');
  const isShippingValid =
    shippingName.trim() && shippingPhone.trim() && shippingAddress.trim() && shippingCity.trim() && shippingPostal.trim();

  useEffect(() => {
    loadProducts();
    if (user) {
      loadCart();
    }
  }, [user]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, vendor_profiles(store_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data as any);
      const uniqueCategories = Array.from(new Set(data.map((p) => p.category)));
      setCategories(uniqueCategories);
    }
  };

  const loadCart = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('cart_items')
      .select('*, products(*, vendor_profiles(store_name))')
      .eq('user_id', user.id);

    if (data) setCartItems(data as any);
  };

  const addToCart = async (productId: string) => {
    if (!user) return;

    const existingItem = cartItems.find((item) => item.product_id === productId);

    if (existingItem) {
      await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
    } else {
      await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: productId,
        quantity: 1,
      });
    }

    loadCart();
  };

  const updateCartQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await supabase.from('cart_items').delete().eq('id', itemId);
    } else {
      await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', itemId);
    }
    loadCart();
  };

  const checkout = async () => {
    if (cartItems.length === 0 || !user) return;
    if (!isShippingValid) {
      alert('Please fill in shipping details to place your order.');
      return;
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.products.price * item.quantity,
      0
    );

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid',
        shipping_name: shippingName,
        shipping_phone: shippingPhone,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostal,
      })
      .select()
      .single();

    if (orderError || !order) return;

    for (const item of cartItems) {
      const { data: vendorData } = await supabase
        .from('vendor_profiles')
        .select('commission_rate')
        .eq('id', item.products.vendor_id)
        .single();

      const commissionRate = vendorData?.commission_rate || 10;
      const itemTotal = item.products.price * item.quantity;
      const commissionAmount = (itemTotal * commissionRate) / 100;
      const vendorAmount = itemTotal - commissionAmount;

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        vendor_id: item.products.vendor_id,
        quantity: item.quantity,
        price: item.products.price,
        commission_amount: commissionAmount,
        vendor_amount: vendorAmount,
      });

      await supabase
        .from('products')
        .update({
          stock_quantity: item.products.stock_quantity - item.quantity
        })
        .eq('id', item.product_id);
    }

    await supabase.from('cart_items').delete().eq('user_id', user.id);

    setShowCart(false);
    loadCart();
    loadProducts();
    // Navigate to confirmation page
    navigate(`/order/${order.id}/confirmation`);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Marketplace – MarketHub"
        description="Browse and shop products from multiple vendors on MarketHub. Secure checkout and great deals."
        canonical="https://www.markethub.example/"
        url="https://www.markethub.example/"
        image="/og-cover.png"
      />
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Store className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
                <p className="text-sm text-slate-600">Shop from multiple vendors</p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <ShoppingCart size={20} />
              <span className="font-medium">Cart</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative w-56">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 h-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-slate-400 mb-4" />
            <p className="text-xl text-slate-600">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition flex flex-col cursor-pointer"
                onClick={() => navigate(`/product/${product.id}/${slugify(product.name)}`)}
              >
                <div className="h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain p-2" />
                  ) : (
                    <Package size={48} className="text-slate-400" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Store size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-600">
                      {product.vendor_profiles?.store_name || 'Unknown Store'}
                    </span>
                  </div>
                  <div className="mb-3 min-h-20">
                    <h3 className="font-semibold text-slate-900">{product.name}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-slate-900">${product.price}</span>
                    <span className="text-sm text-slate-500">{product.stock_quantity} in stock</span>
                  </div>
                  <span className="flex items-center justify-center h-8 w-full text-xs bg-slate-100 text-slate-600 rounded-full mb-3">
                    {product.category}
                  </span>
                  <button
                    disabled={!user || product.stock_quantity === 0}
                    className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product.id);
                    }}
                  >
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Shopping Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={64} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-slate-50 p-4 rounded-lg">
                        <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.products.image_url ? (
                            <img
                              src={item.products.image_url}
                              alt={item.products.name}
                              className="max-h-full max-w-full object-contain p-1 rounded-lg"
                            />
                          ) : (
                            <Package size={32} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{item.products.name}</h3>
                          <p className="text-sm text-slate-600">
                            {item.products.vendor_profiles?.store_name || 'Unknown Store'}
                          </p>
                          <p className="text-lg font-bold text-slate-900 mt-1">${item.products.price}</p>
                        </div>
                        <div className="flex flex-col justify-between items-end">
                          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-300">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="p-2 hover:bg-slate-100 rounded-l-lg transition"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-3 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.products.stock_quantity}
                              className="p-2 hover:bg-slate-100 rounded-r-lg transition disabled:opacity-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="font-bold text-slate-900">
                            ${(item.products.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
                        <input
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                        <input
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2"
                          placeholder="0300-0000000"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                        <input
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2"
                          placeholder="House #, Street, Area"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                        <input
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Postal code</label>
                        <input
                          value={shippingPostal}
                          onChange={(e) => setShippingPostal(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2"
                          placeholder="12345"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="block text-sm font-medium text-slate-700 mb-2">Payment method</span>
                      <label className="flex items-center gap-2 text-slate-700">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="text-blue-600"
                        />
                        Cash on Delivery
                      </label>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-semibold text-slate-700">Total:</span>
                      <span className="text-3xl font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={checkout}
                      disabled={!isShippingValid}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg transition disabled:opacity-50"
                    >
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Product modal removed; navigation opens details page */}
    </div>
  );
}


