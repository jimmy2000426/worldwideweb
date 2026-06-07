import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LoadingScreen } from './Ui';

function getRedirectPath(role) {
  if (role === 'barber' || role === 'admin') return '/dashboard';
  if (role === 'customer') return '/appointments';
  return '/';
}

export function ProtectedRoute({ allowedRoles }) {
  const { ready, isAuthed, role } = useApp();
  const location = useLocation();

  if (!ready) {
    return <LoadingScreen label="驗證登入中..." />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to={getRedirectPath(role)} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { ready, isAuthed, role } = useApp();

  if (!ready) {
    return <LoadingScreen label="載入登入畫面..." />;
  }

  if (isAuthed) {
    return <Navigate to={getRedirectPath(role)} replace />;
  }

  return <Outlet />;
}
