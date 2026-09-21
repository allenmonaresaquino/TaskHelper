import { Task, Subtask, Priority, Status, LocalDbStatus } from '../types';
import { Logger } from './logger';

const TASKS_STORAGE_KEY = 'task_manager_tasks_v1';
const LINKED_FILE_NAME_KEY = 'task_manager_linked_file_name_v1';

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    title: 'Implement OAuth2 PKCE Authentication Flow',
    description: 'Build user login and token refresh logic with secure cookies and offline token caching.',
    priority: 'urgent',
    status: 'in_progress',
    progress: 66,
    autoProgress: true,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    category: 'Backend',
    tags: ['#auth', '#security', '#api'],
    githubUrl: 'https://github.com/myorg/backend-service/pull/142',
    subtasks: [
      { id: 'sub-1', title: 'Configure client credentials & PKCE verifier', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-2', title: 'Implement refresh token rotation endpoint', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-3', title: 'Add unit tests for expired token edge cases', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-102',
    title: 'Design Minimalist Task Analytics Dashboard',
    description: 'Create responsive metrics widgets for completed vs pending items, upcoming deadlines, and category filters.',
    priority: 'high',
    status: 'completed',
    progress: 100,
    autoProgress: true,
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    category: 'Design',
    tags: ['#ui', '#dashboard', '#tailwind'],
    githubUrl: 'https://github.com/myorg/web-app/commit/7a82b9c',
    subtasks: [
      { id: 'sub-4', title: 'Define color tokens and typography scale', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-5', title: 'Wireframe metric summary cards', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-6', title: 'Review accessibility contrast ratio (WCAG AA)', completed: true, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-103',
    title: 'Add Offline IndexedDB & Local JSON Sync',
    description: 'Ensure all mutations write immediately to local storage and support reliable JSON/CSV export.',
    priority: 'high',
    status: 'in_progress',
    progress: 50,
    autoProgress: true,
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    category: 'Frontend',
    tags: ['#pwa', '#offline', '#storage'],
    githubUrl: 'https://github.com/myorg/web-app/pull/89',
    subtasks: [
      { id: 'sub-7', title: 'Add online/offline network listeners', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-8', title: 'Write JSON and CSV serialization utilities', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-104',
    title: 'Setup Automated Release GitHub Actions Workflow',
    description: 'Deploy staging previews automatically on pull request merge.',
    priority: 'medium',
    status: 'todo',
    progress: 0,
    autoProgress: false,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    category: 'DevOps',
    tags: ['#ci-cd', '#actions', '#docker'],
    githubUrl: 'https://github.com/myorg/web-app/issues/31',
    subtasks: [
      { id: 'sub-9', title: 'Draft action yaml config', completed: false, createdAt: new Date().toISOString() },
      { id: 'sub-10', title: 'Configure runner secrets', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-105',
    title: 'Fix Memory Leak in WebSocket Event Listener',
    description: 'Ensure sockets are cleanly disconnected on unmount to avoid ghost listener retain cycles.',
    priority: 'urgent',
    status: 'review',
    progress: 100,
    autoProgress: true,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    category: 'Bugfix',
    tags: ['#bug', '#performance', '#sockets'],
    githubUrl: 'https://github.com/myorg/backend-service/pull/154',
    subtasks: [
      { id: 'sub-11', title: 'Reproduce leak in staging environment', completed: true, createdAt: new Date().toISOString() },
      { id: 'sub-12', title: 'Add AbortController cleanup in useEffect', completed: true, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// In-memory reference to user's linked local PC file handle (File System Access API)
let linkedFileHandle: any = null;

export const TaskStorage = {
  // Check whether running inside an iframe subframe where cross-origin FileSystemAccess is blocked by browsers
  isInIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  },

  // Check if Native File System Access API is supported and usable (outside of cross-origin subframes)
  isFileSystemSupported(): boolean {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window && !TaskStorage.isInIframe();
  },

  getLinkedFileName(): string | null {
    return linkedFileHandle?.name || localStorage.getItem(LINKED_FILE_NAME_KEY) || null;
  },

  // Synchronously load from local storage
  loadTasks(): Task[] {
    try {
      const raw = localStorage.getItem(TASKS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
        Logger.info('STORAGE_INIT', `Initialized local storage with ${INITIAL_TASKS.length} tasks`);
        return INITIAL_TASKS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_TASKS;
    } catch (err) {
      Logger.error('STORAGE_READ_ERROR', 'Failed reading tasks from localStorage.', undefined, {
        error: String(err),
      });
      return INITIAL_TASKS;
    }
  },

  // Fetch tasks from local server file (data/tasks-db.json)
  async fetchFromLocalServer(): Promise<Task[] | null> {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(data.tasks));
        Logger.debug('SERVER_DB_SYNC', `Synced ${data.tasks.length} tasks from local file database`);
        return data.tasks;
      }
      return null;
    } catch {
      // Local server API might not be available if pure offline
      return null;
    }
  },

  // Query local database status from server
  async getLocalDbStatus(): Promise<LocalDbStatus> {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          linkedFileName: TaskStorage.getLinkedFileName() || undefined,
          isFileSystemSupported: TaskStorage.isFileSystemSupported(),
        };
      }
    } catch {
      // Fallback
    }

    // Default client-side fallback info
    const raw = localStorage.getItem(TASKS_STORAGE_KEY) || '[]';
    const size = new Blob([raw]).size;
    return {
      filePath: 'Browser Local Storage (data/tasks-db.json synced)',
      fileName: 'tasks-db.json',
      dataDirectory: './data',
      fileSizeBytes: size,
      fileSizeKb: Math.round((size / 1024) * 10) / 10,
      lastModified: new Date().toISOString(),
      taskCount: JSON.parse(raw).length,
      linkedFileName: TaskStorage.getLinkedFileName() || undefined,
      isFileSystemSupported: TaskStorage.isFileSystemSupported(),
    };
  },

  // Save tasks to localStorage, local server file on PC, and linked file handle
  saveTasks(tasks: Task[]): void {
    // 1. Save to localStorage immediately (instant optimistic UI)
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      Logger.debug('STORAGE_WRITE', `Saved ${tasks.length} tasks locally`);
    } catch (err) {
      Logger.error('STORAGE_WRITE_ERROR', 'Failed to save tasks into localStorage', undefined, { error: String(err) });
    }

    // 2. Persist to server local disk file (data/tasks-db.json)
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    }).catch(() => {
      // Server offline, stored in browser local storage
    });

    // 3. If user linked a file directly on their PC/laptop via File System Access API, write to it!
    if (linkedFileHandle) {
      TaskStorage.writeToLinkedHandle(tasks).catch((err) => {
        Logger.warn('LINKED_FILE_WRITE_WARN', `Could not write to linked PC file: ${err}`);
      });
    }
  },

  // Link a local file on the PC/laptop (e.g., C:\Users\...\Desktop\tasks.json)
  async linkLocalPcFile(currentTasks: Task[]): Promise<{
    success: boolean;
    fileName?: string;
    error?: string;
    downloaded?: boolean;
  }> {
    // If inside a cross-origin iframe (e.g., in AI Studio preview), browser security forbids showSaveFilePicker.
    // Instead of throwing an error, seamlessly download the tasks-db.json file directly to the PC!
    if (TaskStorage.isInIframe() || typeof window === 'undefined' || !('showSaveFilePicker' in window)) {
      TaskStorage.exportToJson(currentTasks, 'tasks-db.json');
      Logger.info('LOCAL_PC_FILE_DOWNLOADED', 'Saved tasks-db.json directly to PC via browser download');
      return {
        success: true,
        fileName: 'tasks-db.json',
        downloaded: true,
      };
    }

    try {
      // Prompt user to select or create a .json file on their computer
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'tasks-db.json',
        types: [
          {
            description: 'JSON Database File',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      linkedFileHandle = handle;
      localStorage.setItem(LINKED_FILE_NAME_KEY, handle.name);

      // Write current tasks into this newly linked file
      await TaskStorage.writeToLinkedHandle(currentTasks);

      Logger.info('LOCAL_PC_FILE_LINKED', `Directly linked local file on PC: ${handle.name}`);
      return { success: true, fileName: handle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'File selection cancelled' };
      }
      // If browser throws SecurityError due to cross-origin subframes or permissions
      if (
        err.name === 'SecurityError' ||
        String(err?.message || '').toLowerCase().includes('sub frame') ||
        String(err?.message || '').toLowerCase().includes('cross origin')
      ) {
        TaskStorage.exportToJson(currentTasks, 'tasks-db.json');
        Logger.info('LOCAL_PC_FILE_DOWNLOADED', 'Saved tasks-db.json directly to PC (iframe security fallback)');
        return {
          success: true,
          fileName: 'tasks-db.json',
          downloaded: true,
        };
      }
      return { success: false, error: err.message || 'Failed to link local file' };
    }
  },

  // Open and link an existing file on the PC/laptop
  async openAndLinkLocalPcFile(): Promise<{
    success: boolean;
    tasks?: Task[];
    fileName?: string;
    error?: string;
    isImportedOnly?: boolean;
  }> {
    if (TaskStorage.isInIframe() || typeof window === 'undefined' || !('showOpenFilePicker' in window)) {
      return TaskStorage.promptSelectJsonFile();
    }

    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'JSON Database File',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text);
      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : (Array.isArray(parsed) ? parsed : []);

      linkedFileHandle = handle;
      localStorage.setItem(LINKED_FILE_NAME_KEY, handle.name);
      TaskStorage.saveTasks(tasks);

      Logger.info('LOCAL_PC_FILE_OPENED', `Loaded and linked ${tasks.length} tasks from ${handle.name}`);
      return { success: true, tasks, fileName: handle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'File open cancelled' };
      }
      if (
        err.name === 'SecurityError' ||
        String(err?.message || '').toLowerCase().includes('sub frame') ||
        String(err?.message || '').toLowerCase().includes('cross origin')
      ) {
        return TaskStorage.promptSelectJsonFile();
      }
      return { success: false, error: err.message || 'Failed to open local file' };
    }
  },

  // Standard HTML file picker fallback (completely safe and supported in cross-origin iframes)
  promptSelectJsonFile(): Promise<{
    success: boolean;
    tasks?: Task[];
    fileName?: string;
    error?: string;
    isImportedOnly?: boolean;
  }> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve({ success: false, error: 'No file selected' });
          return;
        }
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : (Array.isArray(parsed) ? parsed : []);
          TaskStorage.saveTasks(tasks);
          Logger.info('LOCAL_PC_FILE_IMPORTED', `Loaded ${tasks.length} tasks from ${file.name}`);
          resolve({ success: true, tasks, fileName: file.name, isImportedOnly: true });
        } catch (err: any) {
          resolve({ success: false, error: 'Invalid JSON file: ' + err.message });
        } finally {
          if (input.parentNode) {
            input.parentNode.removeChild(input);
          }
        }
      };

      input.oncancel = () => {
        resolve({ success: false, error: 'File open cancelled' });
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      };

      document.body.appendChild(input);
      input.click();
    });
  },

  async writeToLinkedHandle(tasks: Task[]): Promise<void> {
    if (!linkedFileHandle) return;
    const writable = await linkedFileHandle.createWritable();
    const payload = {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      source: 'TaskManager Local PC Direct Link',
      taskCount: tasks.length,
      tasks,
    };
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    Logger.debug('LINKED_FILE_WRITTEN', `Auto-saved ${tasks.length} tasks to ${linkedFileHandle.name}`);
  },

  unlinkLocalPcFile(): void {
    linkedFileHandle = null;
    localStorage.removeItem(LINKED_FILE_NAME_KEY);
    Logger.info('LOCAL_PC_FILE_UNLINKED', 'Unlinked local file handle. Reverting to internal local database.');
  },

  calculateProgress(subtasks: Subtask[], currentProgress: number, auto: boolean): number {
    if (!auto || subtasks.length === 0) return currentProgress;
    const completedCount = subtasks.filter((s) => s.completed).length;
    return Math.round((completedCount / subtasks.length) * 100);
  },

  createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const progress = TaskStorage.calculateProgress(data.subtasks || [], data.progress || 0, data.autoProgress);

    const newTask: Task = {
      ...data,
      id,
      progress,
      createdAt: now,
      updatedAt: now,
      completedAt: data.status === 'completed' ? now : undefined,
    };

    const current = TaskStorage.loadTasks();
    const updated = [newTask, ...current];
    TaskStorage.saveTasks(updated);

    Logger.info('TASK_CREATED', `Created task: "${newTask.title}" [${newTask.priority.toUpperCase()}]`, newTask.id, {
      subtaskCount: newTask.subtasks.length,
      category: newTask.category,
      githubUrl: newTask.githubUrl,
    });

    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const current = TaskStorage.loadTasks();
    const index = current.findIndex((t) => t.id === id);
    if (index === -1) {
      Logger.warn('TASK_UPDATE_NOT_FOUND', `Attempted to update non-existent task ${id}`, id);
      return null;
    }

    const prev = current[index];
    const now = new Date().toISOString();

    const mergedSubtasks = updates.subtasks !== undefined ? updates.subtasks : prev.subtasks;
    const auto = updates.autoProgress !== undefined ? updates.autoProgress : prev.autoProgress;
    const rawProgress = updates.progress !== undefined ? updates.progress : prev.progress;
    const computedProgress = TaskStorage.calculateProgress(mergedSubtasks, rawProgress, auto);

    const nextStatus = updates.status !== undefined ? updates.status : prev.status;
    let completedAt = prev.completedAt;
    if (nextStatus === 'completed' && prev.status !== 'completed') {
      completedAt = now;
    } else if (nextStatus !== 'completed') {
      completedAt = undefined;
    }

    const updatedTask: Task = {
      ...prev,
      ...updates,
      subtasks: mergedSubtasks,
      progress: computedProgress,
      status: nextStatus,
      completedAt,
      updatedAt: now,
    };

    current[index] = updatedTask;
    TaskStorage.saveTasks(current);

    Logger.info('TASK_UPDATED', `Updated task: "${updatedTask.title}" (${nextStatus})`, updatedTask.id, {
      priority: updatedTask.priority,
      progress: updatedTask.progress,
    });

    return updatedTask;
  },

  deleteTask(id: string): boolean {
    const current = TaskStorage.loadTasks();
    const target = current.find((t) => t.id === id);
    if (!target) return false;

    const remaining = current.filter((t) => t.id !== id);
    TaskStorage.saveTasks(remaining);

    Logger.warn('TASK_DELETED', `Deleted task: "${target.title}"`, id);
    return true;
  },

  toggleSubtask(taskId: string, subtaskId: string): Task | null {
    const current = TaskStorage.loadTasks();
    const taskIndex = current.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = current[taskIndex];
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const computedProgress = TaskStorage.calculateProgress(
      updatedSubtasks,
      task.progress,
      task.autoProgress
    );

    let newStatus = task.status;
    if (task.autoProgress && updatedSubtasks.length > 0) {
      const allDone = updatedSubtasks.every((s) => s.completed);
      if (allDone && task.status !== 'completed') {
        newStatus = 'completed';
      } else if (!allDone && task.status === 'completed') {
        newStatus = 'in_progress';
      }
    }

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      progress: computedProgress,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    };

    current[taskIndex] = updatedTask;
    TaskStorage.saveTasks(current);

    const toggled = updatedSubtasks.find((s) => s.id === subtaskId);
    Logger.info(
      'SUBTASK_TOGGLED',
      `Subtask "${toggled?.title}" set to ${toggled?.completed ? 'COMPLETED' : 'INCOMPLETE'}`,
      taskId,
      { progress: computedProgress }
    );

    return updatedTask;
  },

  addSubtask(taskId: string, title: string): Task | null {
    if (!title.trim()) return null;
    const current = TaskStorage.loadTasks();
    const taskIndex = current.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = current[taskIndex];
    const newSubtask: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedSubtasks = [...task.subtasks, newSubtask];
    const computedProgress = TaskStorage.calculateProgress(
      updatedSubtasks,
      task.progress,
      task.autoProgress
    );

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      progress: computedProgress,
      updatedAt: new Date().toISOString(),
    };

    current[taskIndex] = updatedTask;
    TaskStorage.saveTasks(current);

    Logger.info('SUBTASK_ADDED', `Added subtask "${newSubtask.title}" to task "${task.title}"`, taskId);
    return updatedTask;
  },

  deleteSubtask(taskId: string, subtaskId: string): Task | null {
    const current = TaskStorage.loadTasks();
    const taskIndex = current.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = current[taskIndex];
    const updatedSubtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    const computedProgress = TaskStorage.calculateProgress(
      updatedSubtasks,
      task.progress,
      task.autoProgress
    );

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      progress: computedProgress,
      updatedAt: new Date().toISOString(),
    };

    current[taskIndex] = updatedTask;
    TaskStorage.saveTasks(current);

    Logger.info('SUBTASK_REMOVED', `Removed subtask from "${task.title}"`, taskId);
    return updatedTask;
  },

  exportToJson(tasks: Task[], customFilename?: string): void {
    try {
      const payload = {
        app: 'TaskManager',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        totalTasks: tasks.length,
        tasks,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = customFilename || `tasks-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Logger.info('DATA_EXPORTED_JSON', `Exported ${tasks.length} tasks to ${link.download}`);
    } catch (err) {
      Logger.error('EXPORT_JSON_FAILED', 'Failed to generate JSON export file', undefined, { error: String(err) });
    }
  },

  exportToCsv(tasks: Task[]): void {
    try {
      const headers = [
        'ID',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Progress (%)',
        'Due Date',
        'Category',
        'Tags',
        'GitHub Link',
        'Subtasks Count',
        'Completed Subtasks',
        'Subtask Details',
        'Created At',
        'Updated At',
      ];

      const escapeCsv = (str: string | number | undefined | null) => {
        if (str === undefined || str === null) return '""';
        const stringified = String(str).replace(/"/g, '""');
        return `"${stringified}"`;
      };

      const rows = tasks.map((t) => {
        const completedSubtasks = t.subtasks.filter((s) => s.completed).length;
        const subtasksSummary = t.subtasks
          .map((s) => `[${s.completed ? 'X' : ' '}] ${s.title}`)
          .join('; ');

        return [
          escapeCsv(t.id),
          escapeCsv(t.title),
          escapeCsv(t.description),
          escapeCsv(t.status),
          escapeCsv(t.priority),
          escapeCsv(t.progress),
          escapeCsv(t.dueDate || 'N/A'),
          escapeCsv(t.category),
          escapeCsv(t.tags.join(', ')),
          escapeCsv(t.githubUrl || ''),
          escapeCsv(t.subtasks.length),
          escapeCsv(completedSubtasks),
          escapeCsv(subtasksSummary),
          escapeCsv(t.createdAt),
          escapeCsv(t.updatedAt),
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `tasks-export-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Logger.info('DATA_EXPORTED_CSV', `Exported ${tasks.length} tasks to CSV file`);
    } catch (err) {
      Logger.error('EXPORT_CSV_FAILED', 'Failed to generate CSV export file', undefined, { error: String(err) });
    }
  },

  async importFromJson(file: File): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let importedTasks: Task[] = [];
      if (Array.isArray(parsed)) {
        importedTasks = parsed;
      } else if (parsed && Array.isArray(parsed.tasks)) {
        importedTasks = parsed.tasks;
      } else {
        throw new Error('Invalid backup file format. Expected a list of tasks or an object with a tasks array.');
      }

      const validTasks: Task[] = importedTasks.map((t, idx) => ({
        id: t.id || `task_import_${Date.now()}_${idx}`,
        title: t.title || 'Untitled Task',
        description: t.description || '',
        priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium',
        status: ['todo', 'in_progress', 'review', 'completed'].includes(t.status) ? t.status : 'todo',
        progress: typeof t.progress === 'number' ? Math.min(100, Math.max(0, t.progress)) : 0,
        autoProgress: typeof t.autoProgress === 'boolean' ? t.autoProgress : true,
        dueDate: t.dueDate || '',
        category: t.category || 'General',
        tags: Array.isArray(t.tags) ? t.tags : [],
        githubUrl: t.githubUrl || undefined,
        subtasks: Array.isArray(t.subtasks)
          ? t.subtasks.map((st: Subtask, sIdx: number) => ({
              id: st.id || `sub_import_${Date.now()}_${sIdx}`,
              title: st.title || 'Subtask',
              completed: Boolean(st.completed),
              createdAt: st.createdAt || new Date().toISOString(),
            }))
          : [],
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: t.completedAt,
      }));

      TaskStorage.saveTasks(validTasks);
      Logger.info('DATA_IMPORTED', `Successfully imported ${validTasks.length} tasks from ${file.name}`);

      return { success: true, count: validTasks.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown import error';
      Logger.error('IMPORT_FAILED', `Failed to import tasks from ${file.name}: ${msg}`, undefined, { error: msg });
      return { success: false, count: 0, error: msg };
    }
  },
};
