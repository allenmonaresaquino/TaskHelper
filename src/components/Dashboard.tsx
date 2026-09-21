import React from 'react';
import { Task, TaskStats } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  Layers,
  ArrowUpRight,
  GitBranch
} from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  stats: TaskStats;
  onSelectTask: (task: Task) => void;
  onFilterDeadline: (filter: 'all' | 'overdue' | 'due_today' | 'due_week' | 'upcoming') => void;
  activeDeadlineFilter: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  stats,
  onSelectTask,
  onFilterDeadline,
  activeDeadlineFilter,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Upcoming items (sorted by due date, excluding completed)
  const upcomingTasks = tasks
    .filter((t) => t.status !== 'completed' && t.dueDate)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 5);

  const getDaysRemaining = (dueDate: string) => {
    const target = new Date(dueDate).getTime();
    const today = new Date(todayStr).getTime();
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div id="dashboard-section" className="space-y-4 mb-6">
      {/* High-level Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total & Completion */}
        <div 
          id="stat-card-total" 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completion</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.completionRate}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({stats.completed}/{stats.total})
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending & In Progress */}
        <div 
          id="stat-card-pending" 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.inProgress + stats.review}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                active now
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.todo} waiting in backlog
            </p>
          </div>
        </div>

        {/* Overdue Alert */}
        <button
          id="stat-card-overdue"
          onClick={() => onFilterDeadline(activeDeadlineFilter === 'overdue' ? 'all' : 'overdue')}
          className={`text-left bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col justify-between shadow-xs transition-all cursor-pointer ${
            activeDeadlineFilter === 'overdue'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue</span>
            <div className={`p-1.5 rounded-lg ${stats.overdue > 0 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${stats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {stats.overdue}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stats.overdue === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">
              {stats.overdue > 0 ? 'Click to view overdue' : 'Zero overdue items'}
            </p>
          </div>
        </button>

        {/* Subtask Stats */}
        <div 
          id="stat-card-subtasks" 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Subtasks</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.completedSubtasks}/{stats.totalSubtasks}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                done
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.totalSubtasks - stats.completedSubtasks} remaining steps
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines List */}
      <div 
        id="upcoming-deadlines-panel" 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFilterDeadline('due_today')}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                activeDeadlineFilter === 'due_today'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => onFilterDeadline('due_week')}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                activeDeadlineFilter === 'due_week'
                  ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              This Week
            </button>
            {activeDeadlineFilter !== 'all' && (
              <button
                onClick={() => onFilterDeadline('all')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
            No upcoming deadlines on pending tasks. All clear!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
            {upcomingTasks.map((t) => {
              const days = getDaysRemaining(t.dueDate);
              const isOverdue = days < 0;
              const isToday = days === 0;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="py-2.5 px-1.5 -mx-1.5 rounded-lg flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isOverdue
                          ? 'bg-rose-500'
                          : isToday
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-indigo-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>{t.category}</span>
                        {t.githubUrl && (
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <GitBranch className="w-3 h-3" />
                            PR/Commit linked
                          </span>
                        )}
                        <span>•</span>
                        <span>{t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} subtasks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isOverdue
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                          : isToday
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          : days <= 3
                          ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(days)}d overdue`
                        : isToday
                        ? 'Due today'
                        : `In ${days} days`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
