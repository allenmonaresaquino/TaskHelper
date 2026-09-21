import React, { useState, useEffect, useRef } from 'react';
import { Task, LocalDbStatus } from '../types';
import { TaskStorage } from '../services/storage';
import { 
  X, 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen,
  Save,
  Unlink,
  Laptop,
  RefreshCw,
  FileCode,
  ExternalLink
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onImportComplete: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onImportComplete,
}) => {
  const [dbStatus, setDbStatus] = useState<LocalDbStatus | null>(null);
  const [linkedName, setLinkedName] = useState<string | null>(TaskStorage.getLinkedFileName());
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStatus = async () => {
    const status = await TaskStorage.getLocalDbStatus();
    setDbStatus(status);
    setLinkedName(TaskStorage.getLinkedFileName());
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dataSize = Math.round(new Blob([JSON.stringify(tasks)]).size / 1024 * 10) / 10;

  const handleExportJson = () => {
    TaskStorage.exportToJson(tasks);
    setStatusMessage({ type: 'success', text: 'Downloaded portable JSON backup file to your PC' });
  };

  const handleExportCsv = () => {
    TaskStorage.exportToCsv(tasks);
    setStatusMessage({ type: 'success', text: 'Downloaded spreadsheet CSV file to your PC' });
  };

  const handleLinkNewFile = async () => {
    setStatusMessage({ type: 'info', text: 'Preparing file on your PC...' });
    const res = await TaskStorage.linkLocalPcFile(tasks);
    if (res.success) {
      if (res.downloaded) {
        setStatusMessage({
          type: 'success',
          text: `Saved & downloaded "${res.fileName}" directly to your PC. (Tip: To enable live 2-way sync with your file system, open this app in a new tab where browser sub-frame restrictions do not apply).`,
        });
      } else if (res.fileName) {
        setLinkedName(res.fileName);
        setStatusMessage({ 
          type: 'success', 
          text: `Directly linked to local PC file: "${res.fileName}". All changes will write straight to this file on your disk.` 
        });
      }
      refreshStatus();
    } else if (res.error) {
      setStatusMessage({ type: 'error', text: res.error });
    }
  };

  const handleOpenExistingFile = async () => {
    setStatusMessage({ type: 'info', text: 'Selecting local file on your PC...' });
    const res = await TaskStorage.openAndLinkLocalPcFile();
    if (res.success && res.fileName) {
      if (!res.isImportedOnly) {
        setLinkedName(res.fileName);
      }
      setStatusMessage({
        type: 'success',
        text: `Loaded ${res.tasks?.length ?? 0} tasks from "${res.fileName}".` +
              (res.isImportedOnly ? ' (Saved safely into your local database)' : ' (Live 2-way linked)'),
      });
      onImportComplete();
      refreshStatus();
    } else if (res.error) {
      setStatusMessage({ type: 'error', text: res.error });
    }
  };

  const handleUnlink = () => {
    TaskStorage.unlinkLocalPcFile();
    setLinkedName(null);
    setStatusMessage({ type: 'info', text: 'Unlinked direct PC file. Data remains safely in local database.' });
    refreshStatus();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await TaskStorage.importFromJson(file);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Successfully restored ${result.count} tasks from ${file.name}`,
      });
      onImportComplete();
      refreshStatus();
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Failed to parse backup file',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Local PC / Laptop Database
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Data is stored directly on your computer's local drive without external cloud databases
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Local PC Disk File (data/tasks-db.json) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  Local Machine Database File
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md">
                100% On Local Disk
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px]">Database Path:</span>
                <span className="font-semibold truncate max-w-[280px]" title={dbStatus?.filePath || 'data/tasks-db.json'}>
                  {dbStatus?.filePath || 'data/tasks-db.json'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px]">Tasks Count:</span>
                <span>{tasks.length} tasks ({tasks.reduce((acc, t) => acc + t.subtasks.length, 0)} subtasks)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px]">Local File Size:</span>
                <span>{dbStatus?.fileSizeKb ?? dataSize} KB</span>
              </div>
            </div>

            {/* Direct download from local disk */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Download the raw database file directly:
              </span>
              <a
                href="/api/database/download"
                download="tasks-db.json"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Save tasks-db.json</span>
              </a>
            </div>
          </div>

          {/* Section 2: Direct PC File Link (File System Access API) */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Direct PC / Laptop File Sync (Native)</span>
              </div>
              {linkedName ? (
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Live Syncing to File
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Optional</span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Link a specific file on your computer (like in Documents, Desktop, or a git repo). 
              Every time you add or edit tasks, the app writes straight to that physical file on your hard drive.
            </p>

            {TaskStorage.isInIframe() && !linkedName && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] gap-2">
                <span>
                  <strong>Preview Iframe:</strong> Browser security restricts live file-picker dialogs inside embedded frames. Clicking below will download/import directly, or open in a new tab for continuous 2-way disk sync.
                </span>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold px-2 py-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 hover:opacity-90 shrink-0 whitespace-nowrap"
                >
                  <span>New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {linkedName ? (
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Active Linked File:</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">{linkedName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      TaskStorage.saveTasks(tasks);
                      setStatusMessage({ type: 'success', text: `Synchronized ${tasks.length} tasks to ${linkedName}` });
                    }}
                    className="p-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md transition flex items-center gap-1"
                    title="Write now"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={handleUnlink}
                    className="p-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md transition flex items-center gap-1"
                    title="Unlink file"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Unlink</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handleLinkNewFile}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition shadow-xs cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Choose / Create File on PC</span>
                </button>
                <button
                  onClick={handleOpenExistingFile}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open Existing File from PC</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Export Formats */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Export Formats (For Backup & External Apps)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportJson}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/60 hover:bg-indigo-50/20 text-left transition group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Export JSON
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Full fidelity backup with subtasks, tags, dates, and github links.
                </p>
              </button>

              <button
                onClick={handleExportCsv}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-slate-800/60 hover:bg-emerald-50/20 text-left transition group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Export CSV
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tabular spreadsheet format for Excel, Notion, or Sheets.
                </p>
              </button>
            </div>
          </div>

          {/* Section 4: Restore Backup */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Restore / Import Backup
            </h4>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/60 dark:bg-slate-800/40 text-center transition cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <Upload className="w-4 h-4" />
                <span>Upload & Restore from JSON Backup</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Local PC Storage Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
