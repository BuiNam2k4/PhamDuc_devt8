import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminGuard from './components/AdminGuard';
import UserGuard from './components/UserGuard';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';
import DashboardPage from './pages/DashboardPage';
import ModelManagementPage from './pages/ModelManagementPage';
import RealtimeMonitoringPage from './pages/RealtimeMonitoringPage';
import OfflineAnalysisPage from './pages/OfflineAnalysisPage';
import ViolationLogsPage from './pages/ViolationLogsPage';
import RoomManagementPage from './pages/RoomManagementPage';
import SubjectManagementPage from './pages/SubjectManagementPage';
import StudentManagementPage from './pages/StudentManagementPage';
import ExamSessionManagementPage from './pages/ExamSessionManagementPage';
import CameraManagementPage from './pages/CameraManagementPage';
import CameraTestPage from './pages/camera-test';
import { authService } from './services';

// Dynamic redirection based on current authentication state and role
function RootRedirect() {
  const token = authService.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const role = authService.getRoleFromToken();
  if (role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (role === 'USER') {
    return <Navigate to="/user" replace />;
  }
  authService.logout();
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="models" element={<ModelManagementPage />} />
            <Route path="realtime" element={<RealtimeMonitoringPage />} />
            <Route path="offline" element={<OfflineAnalysisPage />} />
            <Route path="logs" element={<ViolationLogsPage />} />
            <Route path="rooms" element={<RoomManagementPage />} />
            <Route path="subjects" element={<SubjectManagementPage />} />
            <Route path="students" element={<StudentManagementPage />} />
            <Route path="exam-sessions" element={<ExamSessionManagementPage />} />
            <Route path="cameras" element={<CameraManagementPage />} />
            <Route path="camera-test" element={<CameraTestPage />} />
          </Route>
        </Route>

        {/* Protected User Routes */}
        <Route path="/user" element={<UserGuard />}>
          <Route index element={<UserPage />} />
        </Route>

        {/* Dynamic Root & Fallback Redirects */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
