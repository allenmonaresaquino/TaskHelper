import React, { useState } from 'react';
import { Task, Priority, Status } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  GitBranch, 
  Calendar, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Plus, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, status: Status) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const PRIORITY_STYLES: Record<Priority, { label: string; badge: string; dot: string }> = {
  urgent: {
    label: 'Urgent',
    badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    dot: 'bg-rose-500',
  },
  high: {
    label: 'High',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    dot: 'bg-blue-500',
  },
  low: {
    label: 'Low',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'text-slate-500 border-slate-300 dark:border-slate-700' },
  in_progress: { label: 'In Progress', color: 'text-blue-600 border-blue-400 dark:text-blue-400' },
  review: { label: 'In Review', color: 'text-purple-600 border-purple-400 dark:text-purple-400' },
  completed: { label: 'Completed', color: 'text-emerald-600 border-emerald-500 dark:text-emerald-400' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onEditTask,
  onDeleteTask,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(task.subtasks.length > 0 && task.status !== 'completed');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const isCompleted = task.status === 'completed';

  // Deadline calculation
  const todayStr = new Date().toISOString().split('T')[0];
  let isOverdue = false;
  let isToday = false;
  let daysDiff: number | null = null;

  if (task.dueDate && !isCompleted) {
    const target = new Date(task.dueDate).getTime();
    const today = new Date(todayStr).getTime();
    daysDiff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) isOverdue = true;
    else if (daysDiff === 0) isToday = true;
  }

  const handleCreateQuickSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
      setShowSubtasks(true);
    }
  };

  return (
    <div
      id={`task-card-${task.id}`}
      className={`group bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all duration-200 shadow-xs hover:shadow-md ${
        isCompleted
          ? 'border-slate-200 dark:border-slate-800/80 opacity-85'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-900/60 bg-gradient-to-b from-white to-rose-50/20 dark:from-slate-900 dark:to-rose-950/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header: Category, Priority, and Quick Menu */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Chip */}
          <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {task.category || 'General'}
          </span>

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
              PRIORITY_STYLES[task.priority].badge
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLES[task.priority].dot}`} />
            {PRIORITY_STYLES[task.priority].label}
          </span>
        </div>

        {/* Quick Menu / Actions */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-20"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEditTask(task);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Task
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDeleteTask(task.id);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Title & Primary Status Checkbox */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onUpdateStatus(task.id, isCompleted ? 'todo' : 'completed')}
          className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400 transition shrink-0"
          title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-semibold tracking-tight leading-snug cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition ${
              isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
            }`}
            onClick={() => onEditTask(task)}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
          <span className="font-medium">Progress</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{task.progress}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : task.progress > 70
                ? 'bg-indigo-500'
                : task.progress > 30
                ? 'bg-blue-500'
                : 'bg-slate-400'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Subtasks Section */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
          >
            {showSubtasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              Subtasks ({completedSubtasks}/{totalSubtasks})
            </span>
          </button>

          <button
            onClick={() => setIsAddingSubtask(true)}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> Add Subtask
          </button>
        </div>

        {/* Subtask list */}
        {showSubtasks && (
          <div className="mt-2 space-y-1.5 pl-1">
            {task.subtasks.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between group/st py-1 px-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs transition"
              >
                <button
                  onClick={() => onToggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2 text-left min-w-0 flex-1"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition shrink-0 ${
                      st.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                    }`}
                  >
                    {st.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </span>
                  <span
                    className={`truncate ${
                      st.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st.title}
                  </span>
                </button>

                <button
                  onClick={() => onDeleteSubtask(task.id, st.id)}
                  className="opacity-0 group-hover/st:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 transition"
                  title="Remove subtask"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {isAddingSubtask && (
              <form onSubmit={handleCreateQuickSubtask} className="flex items-center gap-1.5 mt-1.5">
                <input
                  type="text"
                  placeholder="Enter subtask title..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  autoFocus
                  className="flex-1 text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 font-medium"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubtask(false);
                    setNewSubtaskTitle('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Bottom Metadata: Status Selector, GitHub link, Due Date, Tags */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <select
            value={task.status}
            onChange={(e) => onUpdateStatus(task.id, e.target.value as Status)}
            className="text-[11px] font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Right side: GitHub link and Due Date */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* GitHub PR / Commit Link */}
          {task.githubUrl && (
            <a
              href={task.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded-md transition"
              title={task.githubUrl}
            >
              <GitBranch className="w-3 h-3 text-slate-500" />
              <span>GitHub</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          )}

          {/* Due Date Indicator */}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                isCompleted
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  : isOverdue
                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                  : isToday
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {isOverdue
                  ? `${Math.abs(daysDiff!)}d overdue`
                  : isToday
                  ? 'Due Today'
                  : task.dueDate}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Project Tags */}
      {task.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2.5 flex-wrap">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
