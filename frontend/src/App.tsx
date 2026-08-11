import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ModelManagementPage from './pages/ModelManagementPage';
import RealtimeMonitoringPage from './pages/RealtimeMonitoringPage';
import OfflineAnalysisPage from './pages/OfflineAnalysisPage';
import ViolationLogsPage from './pages/ViolationLogsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="models" element={<ModelManagementPage />} />
          <Route path="realtime" element={<RealtimeMonitoringPage />} />
          <Route path="offline" element={<OfflineAnalysisPage />} />
          <Route path="logs" element={<ViolationLogsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
