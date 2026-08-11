import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { ModelStatistic } from '../types';

export interface MainLayoutContextType {
  activeModel: Partial<ModelStatistic>;
  setActiveModel: React.Dispatch<React.SetStateAction<Partial<ModelStatistic>>>;
}

export default function MainLayout() {
  const [activeModel, setActiveModel] = useState<Partial<ModelStatistic>>({
    name: 'YOLOv8-v2.1 (LSTM HeadPose)',
    precision: '89.2%',
    recall: '87.8%',
    f1Score: '88.5%',
    status: 'ACTIVE'
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Header Topbar */}
      <Header activeModel={activeModel} />

      {/* Main Content Viewport */}
      <main className="ml-64 p-6 flex-1 max-w-[1600px]">
        <Outlet context={{ activeModel, setActiveModel }} />
      </main>
    </div>
  );
}
