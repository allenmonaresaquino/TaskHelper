import { AuditLog, LogLevel } from '../types';

const LOGS_STORAGE_KEY = 'task_manager_debug_logs_v1';
const MAX_LOGS = 300;

type LogListener = (logs: AuditLog[]) => void;
const listeners: Set<LogListener> = new Set();

export const Logger = {
  getLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(LOGS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as AuditLog[];
    } catch (e) {
      console.error('Failed to load logs from localStorage', e);
      return [];
    }
  },

  log(level: LogLevel, action: string, details: string, taskId?: string, metadata?: Record<string, unknown>): AuditLog {
    const entry: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      action,
      details,
      taskId,
      metadata,
    };

    try {
      const current = Logger.getLogs();
      const updated = [entry, ...current].slice(0, MAX_LOGS);
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
      listeners.forEach((fn) => fn(updated));
    } catch (e) {
      console.error('Failed to write log to localStorage', e);
    }

    // Also output to console with proper styling
    const prefix = `[TaskManager ${level.toUpperCase()}] [${action}]`;
    if (level === 'error') console.error(prefix, details, metadata);
    else if (level === 'warn') console.warn(prefix, details, metadata);
    else if (level === 'debug') console.debug(prefix, details, metadata);
    else console.log(prefix, details, metadata);

    return entry;
  },

  info(action: string, details: string, taskId?: string, metadata?: Record<string, unknown>) {
    return Logger.log('info', action, details, taskId, metadata);
  },

  warn(action: string, details: string, taskId?: string, metadata?: Record<string, unknown>) {
    return Logger.log('warn', action, details, taskId, metadata);
  },

  error(action: string, details: string, taskId?: string, metadata?: Record<string, unknown>) {
    return Logger.log('error', action, details, taskId, metadata);
  },

  debug(action: string, details: string, taskId?: string, metadata?: Record<string, unknown>) {
    return Logger.log('debug', action, details, taskId, metadata);
  },

  clearLogs() {
    try {
      localStorage.removeItem(LOGS_STORAGE_KEY);
      listeners.forEach((fn) => fn([]));
      Logger.info('SYSTEM_LOGS_CLEARED', 'Audit and debug logs cleared by user');
    } catch (e) {
      console.error('Failed to clear logs', e);
    }
  },

  subscribe(listener: LogListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  exportLogsAsText(): string {
    const logs = Logger.getLogs();
    return logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.action}] ${l.details}${
            l.taskId ? ` (TaskID: ${l.taskId})` : ''
          }${l.metadata ? ` | Meta: ${JSON.stringify(l.metadata)}` : ''}`
      )
      .join('\n');
  },
};
