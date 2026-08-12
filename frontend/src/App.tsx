import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ModelManagementPage from './pages/ModelManagementPage';
import RealtimeMonitoringPage from './pages/RealtimeMonitoringPage';
import OfflineAnalysisPage from './pages/OfflineAnalysisPage';
import ViolationLogsPage from './pages/ViolationLogsPage';
import RoomManagementPage from './pages/RoomManagementPage';
import SubjectManagementPage from './pages/SubjectManagementPage';
import StudentManagementPage from './pages/StudentManagementPage';
import ExamSessionManagementPage from './pages/ExamSessionManagementPage';

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
          <Route path="rooms" element={<RoomManagementPage />} />
          <Route path="subjects" element={<SubjectManagementPage />} />
          <Route path="students" element={<StudentManagementPage />} />
          <Route path="exam-sessions" element={<ExamSessionManagementPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
