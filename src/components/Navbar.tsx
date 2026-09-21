import React from 'react';
import { 
  CheckSquare, 
  Plus, 
  Terminal, 
  HardDrive, 
  DownloadCloud,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { TaskStorage } from '../services/storage';

interface NavbarProps {
  isOnline: boolean;
  onOpenNewTask: () => void;
  onOpenLogs: () => void;
  onOpenExport: () => void;
  onGoHome?: () => void;
  currentView?: 'list' | 'editor';
  activeTasksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  isOnline,
  onOpenNewTask,
  onOpenLogs,
  onOpenExport,
  onGoHome,
  currentView = 'list',
  activeTasksCount,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const linkedFile = TaskStorage.getLinkedFileName();

  return (
    <header id="main-header" className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          className={`flex items-center gap-3 ${onGoHome ? 'cursor-pointer select-none group' : ''}`}
          onClick={onGoHome}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-xs group-hover:scale-105 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Task Manager
              </h1>
              {/* Local Storage / Online status badge */}
              <span
                id="online-status-badge"
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 transition-colors"
                title="100% stored locally on your machine"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Local Database
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {activeTasksCount} active tasks {linkedFile ? `• Synced to ${linkedFile}` : '• Saved on disk'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* All Tasks link if in editor view */}
          {currentView === 'editor' && onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <span>View All Tasks</span>
            </button>
          )}
          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
              title="Install app on your device for offline home-screen access"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Local Database Modal button */}
          <button
            id="export-backup-btn"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Manage local PC database, link files on disk, or export data"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Local DB & Files</span>
            <span className="sm:hidden">DB</span>
          </button>

          {/* Debug Logs button */}
          <button
            id="debug-logs-btn"
            onClick={onOpenLogs}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
            title="View system & debug event logs"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Logs</span>
          </button>

          {/* New Task Primary Button */}
          <button
            id="new-task-btn"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3.5 py-1.5 rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};

