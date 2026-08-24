import React from 'react';
import { Layers, Clock, CheckCircle, User } from 'lucide-react';
import { ExamSession } from '../types';

interface MonitoringMetadataProps {
  selectedSession: ExamSession;
}

export const MonitoringMetadata: React.FC<MonitoringMetadataProps> = ({ selectedSession }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          <Layers className="w-4.5 h-4.5" />
        </div>
        <div className="text-xs leading-none space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Môn Thi</span>
          <span className="font-semibold text-slate-200">{selectedSession.subject?.name}</span>
        </div>
      </div>
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Clock className="w-4.5 h-4.5" />
        </div>
        <div className="text-xs leading-none space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Thời Lượng</span>
          <span className="font-semibold text-slate-200">{selectedSession.duration} phút</span>
        </div>
      </div>
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <CheckCircle className="w-4.5 h-4.5" />
        </div>
        <div className="text-xs leading-none space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Hình thức</span>
          <span className="font-semibold text-slate-200 capitalize">{selectedSession.mode}</span>
        </div>
      </div>
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
          <User className="w-4.5 h-4.5" />
        </div>
        <div className="text-xs leading-none space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Thí sinh</span>
          <span className="font-semibold text-slate-200">{selectedSession.examSessionDetails?.length || 0} Học viên</span>
        </div>
      </div>
    </div>
  );
};
