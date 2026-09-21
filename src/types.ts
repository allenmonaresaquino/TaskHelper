export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Status = 'todo' | 'in_progress' | 'review' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  progress: number; // 0 - 100
  autoProgress: boolean; // true: auto-calculated from subtasks; false: manually set
  dueDate: string; // ISO date string YYYY-MM-DD
  category: string;
  tags: string[];
  githubUrl?: string;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface AuditLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  action: string;
  details: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}

export interface FilterState {
  search: string;
  status: 'all' | Status;
  priority: 'all' | Priority;
  category: string; // 'all' or specific
  tag: string; // 'all' or specific
  deadlineFilter: 'all' | 'overdue' | 'due_today' | 'due_week' | 'upcoming';
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title' | 'progress';
  sortOrder: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  review: number;
  todo: number;
  overdue: number;
  dueSoon: number;
  completionRate: number;
  totalSubtasks: number;
  completedSubtasks: number;
}

export interface LocalDbStatus {
  filePath?: string;
  fileName?: string;
  dataDirectory?: string;
  fileSizeBytes?: number;
  fileSizeKb?: number;
  lastModified?: string;
  taskCount?: number;
  logsFilePath?: string;
  linkedFileName?: string;
  isFileSystemSupported?: boolean;
}

