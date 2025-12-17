import { useAuth } from '../contexts/AuthContext';
import { LogOut, Store, ShoppingBag, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Store className="text-blue-600" size={28} />
              <span className="text-xl font-bold text-slate-900">MarketHub</span>
            </div>

            <div className="flex gap-2">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  currentPath === '/' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag size={18} />
                Shop
              </Link>

              {(profile?.role === 'vendor' || profile?.role === 'admin') && (
                <Link
                  to="/vendor"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    currentPath.startsWith('/vendor')
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Store size={18} />
                  My Store
                </Link>
              )}

              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    currentPath.startsWith('/admin')
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield size={18} />
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


