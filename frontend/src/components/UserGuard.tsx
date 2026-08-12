import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services';

export default function UserGuard() {
  const token = authService.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = authService.getRoleFromToken();
  if (role === 'USER') {
    return <Outlet />;
  } else if (role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  // Clear invalid token if any and redirect to login
  authService.logout();
  return <Navigate to="/login" replace />;
}
