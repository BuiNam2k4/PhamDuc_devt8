import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import ModelManagementPage from './pages/ModelManagementPage';
import RealtimeMonitoringPage from './pages/RealtimeMonitoringPage';
import OfflineAnalysisPage from './pages/OfflineAnalysisPage';
import ViolationLogsPage from './pages/ViolationLogsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModel, setActiveModel] = useState({
    name: 'YOLOv8-v2.1 (LSTM HeadPose)',
    precision: '89.2%',
    recall: '87.8%',
    f1Score: '88.5%',
    status: 'ACTIVE'
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Header Topbar */}
      <Header activeModel={activeModel} />

      {/* Main Content Viewport */}
      <main className="ml-64 p-6 flex-1 max-w-[1600px]">
        {activeTab === 'dashboard' && (
          <DashboardPage setActiveTab={setActiveTab} activeModel={activeModel} />
        )}
        {activeTab === 'models' && (
          <ModelManagementPage activeModel={activeModel} setActiveModel={setActiveModel} />
        )}
        {activeTab === 'realtime' && (
          <RealtimeMonitoringPage />
        )}
        {activeTab === 'offline' && (
          <OfflineAnalysisPage />
        )}
        {activeTab === 'logs' && (
          <ViolationLogsPage />
        )}
      </main>
    </div>
  );
}
