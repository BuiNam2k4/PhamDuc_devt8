import React from 'react';
import { Clock } from 'lucide-react';

export interface TestLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface ConnectionLogsProps {
  logs: TestLog[];
  onClear: () => void;
}

export const ConnectionLogs: React.FC<ConnectionLogsProps> = ({ logs, onClear }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col h-[340px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nhật Ký Kết Nối & Test</h3>
        </div>
        <button
          onClick={onClear}
          className="text-[10px] bg-slate-850 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Xóa logs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            Chưa có log sự kiện nào...
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className={`p-2.5 rounded-lg border leading-relaxed ${
                log.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                log.type === 'warning' ? 'bg-amber-950/20 border-amber-500/20 text-amber-400' :
                log.type === 'error' ? 'bg-red-950/20 border-red-500/20 text-red-400' :
                'bg-slate-900/40 border-slate-850 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-0.5">
                <span>[{log.type.toUpperCase()}]</span>
                <span className="opacity-60">{log.timestamp}</span>
              </div>
              <div>{log.message}</div>
              {log.details && <div className="mt-1 text-[10px] opacity-75 font-sans italic">{log.details}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
