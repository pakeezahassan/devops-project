import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import Marketplace from './components/Marketplace';
import VendorDashboard from './components/VendorDashboard';
import AdminPanel from './components/AdminPanel';
import SEO from './components/SEO';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProductDetails from './components/ProductDetails';
import OrderConfirmation from './components/OrderConfirmation';

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {(
        <SEO
          title="MarketHub – Shop Products from Multiple Vendors"
          description="Browse categories, find great deals from trusted vendors, and checkout securely on MarketHub."
          canonical="https://www.markethub.example/"
          url="https://www.markethub.example/"
          image="/og-cover.png"
        />
      )}
      <Navigation />
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route
          path="/vendor"
          element={profile.role === 'vendor' || profile.role === 'admin' ? <VendorDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={profile.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />}
        />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/product/:id/:slug" element={<ProductDetails />} />
        <Route path="/order/:id/confirmation" element={<OrderConfirmation />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


