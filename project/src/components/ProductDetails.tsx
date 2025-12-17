import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Package, Store, ArrowLeft, ShoppingCart } from 'lucide-react';
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
  meta_title?: string | null;
  meta_description?: string | null;
  meta_image_url?: string | null;
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, vendor_profiles(store_name)')
        .eq('id', id)
        .maybeSingle();
      setProduct((data as unknown as Product) || null);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const addToCart = async () => {
    if (!user || !product) return;
    setAdding(true);
    // upsert-like behavior: try to increment if exists
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: (existing as any).quantity + 1 })
        .eq('id', (existing as any).id);
    } else {
      await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      });
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-slate-700">Product not found.</p>
        <button className="mt-4 text-blue-600 hover:underline" onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <SEO
        title={`${product.meta_title || product.name} – MarketHub`}
        description={product.meta_description || product.description || 'View product details on MarketHub.'}
        canonical={`https://www.markethub.example/product/${product.id}`}
        url={`https://www.markethub.example/product/${product.id}`}
        image={product.meta_image_url || product.image_url || '/og-cover.png'}
      />
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft size={18} />
          Back to shop
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-xl shadow-sm p-6">
        <div className="bg-slate-100 h-96 rounded-lg flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain p-4" />
          ) : (
            <Package size={64} className="text-slate-400" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Store size={16} className="text-slate-400" />
            <span className="text-xs text-slate-600">{product.vendor_profiles?.store_name || 'Unknown Store'}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
          <p className="text-slate-700 mb-4">{product.description}</p>
          <div className="flex items-center justify-between mb-6">
            <span className="text-4xl font-bold text-slate-900">${product.price}</span>
            <span className="text-sm text-slate-500">{product.stock_quantity} in stock</span>
          </div>
          <div className="flex gap-3 mt-auto">
            <button
              onClick={addToCart}
              disabled={!user || product.stock_quantity === 0 || adding}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              {product.stock_quantity === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


