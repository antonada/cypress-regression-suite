import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getSession } from './lib/session';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { NewOrderPage } from './pages/NewOrderPage';

function currentPath(location) {
  return `${location.pathname}${location.search}`;
}

function RequireAuth() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onExpired = () => {
      const returnTo = encodeURIComponent(currentPath(window.location));
      navigate(`/login?reason=expired&returnTo=${returnTo}`, { replace: true });
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [navigate]);

  if (!getSession()) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(currentPath(location))}`} replace />;
  }

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<NewOrderPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
}
