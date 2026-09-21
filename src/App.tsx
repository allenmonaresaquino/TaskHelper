import React, { useState, useEffect, useMemo } from 'react';
import { Task, Subtask, FilterState, TaskStats, Status, Priority } from './types';
import { TaskStorage } from './services/storage';
import { Logger } from './services/logger';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { FilterBar } from './components/FilterBar';
import { TaskCard } from './components/TaskCard';
import { TaskEditorPage } from './components/TaskEditorPage';
import { DebugLogsModal } from './components/DebugLogsModal';
import { ExportImportModal } from './components/ExportImportModal';
import { 
  Plus, 
  Layers, 
  CheckCircle2, 
  SlidersHorizontal, 
  Eye, 
  EyeOff,
  Inbox
} from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  category: 'all',
  tag: 'all',
  deadlineFilter: 'all',
  sortBy: 'dueDate',
  sortOrder: 'asc',
};

export default function App() {
  const isOnline = useOnlineStatus();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [showDashboard, setShowDashboard] = useState(true);

  // Navigation & Modals
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const loaded = TaskStorage.loadTasks();
    setTasks(loaded);

    // Sync with local disk file from backend server
    TaskStorage.fetchFromLocalServer().then((serverTasks) => {
      if (serverTasks && serverTasks.length > 0) {
        setTasks(serverTasks);
      }
    });
  }, []);

  // Compute stats
  const stats = useMemo<TaskStats>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const review = tasks.filter((t) => t.status === 'review').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;

    let overdue = 0;
    let dueSoon = 0;
    let totalSubtasks = 0;
    let completedSubtasks = 0;

    tasks.forEach((t) => {
      totalSubtasks += t.subtasks.length;
      completedSubtasks += t.subtasks.filter((s) => s.completed).length;

      if (t.status !== 'completed' && t.dueDate) {
        const target = new Date(t.dueDate).getTime();
        const today = new Date(todayStr).getTime();
        const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) overdue++;
        else if (diff <= 3) dueSoon++;
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      review,
      todo,
      overdue,
      dueSoon,
      completionRate,
      totalSubtasks,
      completedSubtasks,
    };
  }, [tasks]);

  // Unique categories and tags
  const existingCategories = useMemo(() => {
    const set = new Set<string>(['Development', 'Design', 'Backend', 'Frontend', 'DevOps', 'Bugfix', 'Personal']);
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tasks]);

  const existingTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      t.tags.forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, [tasks]);

  // Filter & Sort Tasks
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTime = new Date(todayStr).getTime();

    return tasks.filter((task) => {
      // Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchCategory = task.category.toLowerCase().includes(q);
        const matchTags = task.tags.some((t) => t.toLowerCase().includes(q));
        const matchSubtasks = task.subtasks.some((s) => s.title.toLowerCase().includes(q));
        const matchGithub = task.githubUrl ? task.githubUrl.toLowerCase().includes(q) : false;

        if (!matchTitle && !matchDesc && !matchCategory && !matchTags && !matchSubtasks && !matchGithub) {
          return false;
        }
      }

      // Status
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Priority
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Category
      if (filters.category !== 'all' && task.category !== filters.category) {
        return false;
      }

      // Tag
      if (filters.tag !== 'all' && !task.tags.includes(filters.tag)) {
        return false;
      }

      // Deadline Filter
      if (filters.deadlineFilter !== 'all') {
        if (!task.dueDate) return false;
        const targetTime = new Date(task.dueDate).getTime();
        const diffDays = Math.round((targetTime - todayTime) / (1000 * 60 * 60 * 24));

        if (filters.deadlineFilter === 'overdue') {
          if (diffDays >= 0 || task.status === 'completed') return false;
        } else if (filters.deadlineFilter === 'due_today') {
          if (diffDays !== 0) return false;
        } else if (filters.deadlineFilter === 'due_week') {
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (filters.deadlineFilter === 'upcoming') {
          if (diffDays < 0) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'dueDate') {
        if (!a.dueDate) comparison = 1;
        else if (!b.dueDate) comparison = -1;
        else comparison = a.dueDate.localeCompare(b.dueDate);
      } else if (filters.sortBy === 'priority') {
        const priorityWeight: Record<Priority, number> = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        comparison = priorityWeight[b.priority] - priorityWeight[a.priority];
      } else if (filters.sortBy === 'progress') {
        comparison = b.progress - a.progress;
      } else if (filters.sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else {
        // createdAt
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, filters]);

  // Handlers
  const handleSaveTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      const updated = TaskStorage.updateTask(id, taskData);
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    } else {
      const created = TaskStorage.createTask(taskData);
      setTasks((prev) => [created, ...prev]);
    }
    setCurrentView('list');
    setTaskToEdit(null);
  };

  const handleUpdateStatus = (taskId: string, status: Status) => {
    const updated = TaskStorage.updateTask(taskId, { status });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = TaskStorage.toggleSubtask(taskId, subtaskId);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    }
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    const updated = TaskStorage.addSubtask(taskId, title);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    }
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = TaskStorage.deleteSubtask(taskId, subtaskId);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      TaskStorage.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (taskToEdit?.id === taskId) {
        setTaskToEdit(null);
        setCurrentView('list');
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setCurrentView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewTask = () => {
    setTaskToEdit(null);
    setCurrentView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterDeadline = (
    filter: 'all' | 'overdue' | 'due_today' | 'due_week' | 'upcoming'
  ) => {
    setFilters((prev) => ({
      ...prev,
      deadlineFilter: prev.deadlineFilter === filter ? 'all' : filter,
    }));
  };

  const handleRefreshFromStorage = () => {
    const loaded = TaskStorage.loadTasks();
    setTasks(loaded);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 sticky top-0 z-40 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
          <span>Offline Mode Active — You can continue adding and editing tasks. All changes are stored safely in local storage.</span>
        </div>
      )}

      {/* Header */}
      <Navbar
        isOnline={isOnline}
        onOpenNewTask={handleNewTask}
        onOpenLogs={() => setIsLogsModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onGoHome={() => {
          setCurrentView('list');
          setTaskToEdit(null);
        }}
        currentView={currentView}
        activeTasksCount={tasks.filter((t) => t.status !== 'completed').length}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentView === 'editor' ? (
          <TaskEditorPage
            task={taskToEdit}
            existingCategories={existingCategories}
            existingTags={existingTags}
            onSave={handleSaveTask}
            onCancel={() => {
              setCurrentView('list');
              setTaskToEdit(null);
            }}
            onDelete={handleDeleteTask}
          />
        ) : (
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
            {/* Toggleable Dashboard Section */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Overview & Deadlines
              </h2>
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                {showDashboard ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Metrics</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Metrics</span>
                  </>
                )}
              </button>
            </div>

            {showDashboard && (
              <Dashboard
                tasks={tasks}
                stats={stats}
                onSelectTask={handleEditTask}
                onFilterDeadline={handleFilterDeadline}
                activeDeadlineFilter={filters.deadlineFilter}
              />
            )}

            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
              categories={existingCategories}
              tags={existingTags}
              totalFiltered={filteredTasks.length}
              totalAll={tasks.length}
            />

            {/* Tasks Stream */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                  {filters.status !== 'all' ? ` in "${filters.status.replace('_', ' ')}"` : ''}
                  {filters.deadlineFilter !== 'all' ? ` (filter: ${filters.deadlineFilter.replace('_', ' ')})` : ''}
                </span>
                <span className="text-[11px]">
                  Sorted by {filters.sortBy} ({filters.sortOrder})
                </span>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No tasks found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {tasks.length === 0
                      ? 'Your task board is empty. Create your first main task to start tracking!'
                      : 'No tasks match your current filter or search criteria. Try adjusting or resetting the filters.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {tasks.length > 0 && (
                      <button
                        onClick={() => setFilters(INITIAL_FILTERS)}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                    <button
                      onClick={handleNewTask}
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Task</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleSubtask={handleToggleSubtask}
                      onAddSubtask={handleAddSubtask}
                      onDeleteSubtask={handleDeleteSubtask}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <DebugLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
        onImportComplete={handleRefreshFromStorage}
      />
    </div>
  );
}
