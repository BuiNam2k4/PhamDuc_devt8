import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services';

export default function AdminGuard() {
  const token = authService.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = authService.getRoleFromToken();
  if (role === 'USER') {
    return <Navigate to="/user" replace />;
  } else if (role !== 'ADMIN') {
    // If the token holds an invalid scope/role, log out and send to login
    authService.logout();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
