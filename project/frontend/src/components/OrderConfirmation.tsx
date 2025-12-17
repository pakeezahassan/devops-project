import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package } from 'lucide-react';
import SEO from './SEO';

type Order = {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: string;
  payment_method?: 'cod' | 'card';
  payment_status?: 'unpaid' | 'paid';
  created_at: string;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    image_url: string | null;
  };
};

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setOrder(orderData as Order | null);

      const { data: itemData } = await supabase
        .from('order_items')
        .select('id, quantity, price, products(id, name, image_url)')
        .eq('order_id', id);
      setItems((itemData as any) || []);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-slate-700">Order not found.</p>
        <Link className="mt-4 inline-block text-blue-600 hover:underline" to="/">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <SEO
        title="Thank you for your order – MarketHub"
        description="Your order has been placed successfully. View your order summary and shipping details."
        canonical={id ? `https://www.markethub.example/order/${id}/confirmation` : undefined}
        url={id ? `https://www.markethub.example/order/${id}/confirmation` : undefined}
        image="/og-cover.png"
      />
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank you! Your order is placed.</h1>
        <p className="text-slate-600 mb-6">Order ID: {order.id}</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Items</h2>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                  <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                    {it.products?.image_url ? (
                      <img src={it.products.image_url} alt={it.products.name} className="max-h-full max-w-full object-contain p-1" />
                    ) : (
                      <Package size={28} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{it.products?.name}</div>
                    <div className="text-sm text-slate-600">Qty: {it.quantity}</div>
                  </div>
                  <div className="font-semibold text-slate-900">${(it.price * it.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Summary</h2>
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between"><span>Payment</span><span className="capitalize">{order.payment_method || 'cod'}</span></div>
              <div className="flex justify-between"><span>Status</span><span className="capitalize">{order.payment_status || 'unpaid'}</span></div>
              <div className="border-t border-slate-200 pt-2">
                <div className="text-sm font-semibold text-slate-900 mb-1">Shipping to</div>
                <div className="text-sm">{order.shipping_name}</div>
                <div className="text-sm">{order.shipping_phone}</div>
                <div className="text-sm">{order.shipping_address}</div>
                <div className="text-sm">{order.shipping_city} {order.shipping_postal_code}</div>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total</span><span>${Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
            <Link to="/" className="mt-4 w-full inline-flex justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


